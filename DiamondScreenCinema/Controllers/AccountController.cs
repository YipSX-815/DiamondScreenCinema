using DiamondScreenCinema.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Net.Mail;

namespace DiamondScreenCinema.Controllers
{
    public class AccountController : Controller
    {
        private readonly DB db;
        private readonly Helper hp;

        public AccountController(DB db, Helper hp)
        {
            this.db = db;
            this.hp = hp;
        }

        public IActionResult Index()
        {
            return RedirectToAction("Authenticate");
        }

        [HttpGet]
        public IActionResult Authenticate()
        {
            return View(new AuthenticateVM
            {
                LoginVM = new LoginVM(),
                RegisterVM = new RegisterVM()
            });
        }

        [HttpPost]
        public IActionResult Login(AuthenticateVM vm)
        {
            ModelState.Clear();

            TryValidateModel(vm.LoginVM, nameof(AuthenticateVM.LoginVM));

            bool usingEmail = !string.IsNullOrWhiteSpace(vm.LoginVM.Email);
            bool usingPhone = !string.IsNullOrWhiteSpace(vm.LoginVM.Phone);
            bool hasCredential = usingEmail || usingPhone;

            if (!hasCredential)
            {
                ModelState.AddModelError("", "Please enter your Email or Phone Number");
            }

            string phoneNumber = vm.LoginVM.PhonePrefix + vm.LoginVM.Phone;
            var user = db.Users.FirstOrDefault(u => u.Email == vm.LoginVM.Email || u.Phone == phoneNumber);

            if (!db.Users.Any(u => u.Email == vm.LoginVM.Email || u.Phone == phoneNumber))
            {
                ModelState.AddModelError("", "Invalid login credential");
                return View("Authenticate", vm);
            }

            if (!hp.VerifyPassword(user.Password, vm.LoginVM.Password))
            {
                ModelState.AddModelError("LoginVM.Password", "Incorrect password");
            }

            if (!ModelState.IsValid)
            {
                return View("Authenticate", vm);
            }

            if (user.Role == "Customer")
            {
                if (user!.AccountStatus == "Verification" && user.Email != null)
                {
                    return RedirectToAction("VerifyEmail", new { email = vm.LoginVM.Email });
                }
                else if (user!.AccountStatus == "Verification" && user.Phone != null)
                {
                    return RedirectToAction("VerifyPhone", new { userId = user.UserId });
                }
                else if (user!.AccountStatus == "Suspended")
                {
                    ModelState.AddModelError("", "Your account has been suspended. Please contact support");

                    return View(vm);
                }
            }

            hp.SignIn(user!.UserId, user.Role, vm.LoginVM.RememberMe);
            return RedirectToAction("Index", "Home");
        }


        [HttpPost]
        public IActionResult Register(AuthenticateVM vm)
        {
            vm.ShowRegister = true;

            ModelState.Clear();
            TryValidateModel(vm.RegisterVM, nameof(AuthenticateVM.RegisterVM));

            if (!string.IsNullOrEmpty(vm.RegisterVM.Password))
            {
                string password = vm.RegisterVM.Password;

                if (password.Length < 8)
                    ModelState.AddModelError("RegisterVM.Password", "Password must be at least 8 characters long");

                if (!password.Any(char.IsUpper))
                    ModelState.AddModelError("RegisterVM.Password", "Password must contain at least one uppercase letter (A-Z)");

                if (!password.Any(char.IsLower))
                    ModelState.AddModelError("RegisterVM.Password", "Password must contain at least one lowercase letter (a-z)");

                if (!password.Any(char.IsDigit))
                    ModelState.AddModelError("RegisterVM.Password", "Password must contain at least one number (0-9)");

                if (!password.Any(c => "!@#$%^&*".Contains(c)))
                    ModelState.AddModelError("RegisterVM.Password", "Password must contain at least one special character (!@#$%^&*)");
            }

            if (db.Users.Any(u => u.Username == vm.RegisterVM.Username))
                ModelState.AddModelError("RegisterVM.Username", "Username already taken");

            if (vm.RegisterVM.DateOfBirth == null)
                ModelState.AddModelError("RegisterVM.DateOfBirth", "Please select your Date of Birth");

            if (vm.RegisterVM.Gender == null)
            {
                ModelState.AddModelError("RegisterVM.Gender", "Please select your Gender");
            }
            else if (vm.RegisterVM.Gender != "Male" && vm.RegisterVM.Gender != "Female")
            {
                ModelState.AddModelError("RegisterVM.Gender", "Invalid Gender");
            }

            if (vm.RegisterVM.Email == null && vm.RegisterVM.Phone == null)
                ModelState.AddModelError("RegisterVM.Email", "Please enter your Email or Phone Number");

            if (!string.IsNullOrEmpty(vm.RegisterVM.Email) &&
                db.Users.Any(u => u.Email == vm.RegisterVM.Email))
                ModelState.AddModelError("RegisterVM.Email", "Email already registered");

            if (!string.IsNullOrEmpty(vm.RegisterVM.Phone))
            {
                string phoneNumber = vm.RegisterVM.PhonePrefix + vm.RegisterVM.Phone;
                if (db.Users.Any(u => u.Phone == phoneNumber))
                    ModelState.AddModelError("RegisterVM.Phone", "Phone number already registered");
            }

            if (!ModelState.IsValid)
                return View("Authenticate", vm);

            string today = DateTime.Now.ToString("yyyyMMdd");

            var lastCustomer = db.Customers
                .Where(c => c.UserId.StartsWith($"CUS-{today}-"))
                .OrderByDescending(c => c.UserId)
                .FirstOrDefault();

            int nextNumber = 1;

            if (lastCustomer != null)
            {
                string lastNumberString = lastCustomer.UserId.Split('-').Last();
                nextNumber = int.Parse(lastNumberString) + 1;
            }

            if (vm.RegisterVM.Email != null)
            {
                var Customer = new Customer
                {
                    UserId = $"CUS-{today}-{nextNumber.ToString("D4")}",
                    Username = vm.RegisterVM.Username,
                    Password = hp.HashPassword(vm.RegisterVM.Password),
                    Email = vm.RegisterVM.Email,
                    Gender = vm.RegisterVM.Gender!,
                    AccountStatus = "Verification",
                    Point = 0,
                    MembershipTier = "Bronze",
                    DateOfBirth = vm.RegisterVM.DateOfBirth!.Value,
                };
                db.Add(Customer);
                db.SaveChanges();

                string verificationCode = new Random().Next(100000, 999999).ToString();
                Response.Cookies.Append("DscOtp", verificationCode, new CookieOptions
                {
                    Expires = DateTime.UtcNow.AddMinutes(5),
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict
                });
                Response.Cookies.Append("DscOtpEmail", vm.RegisterVM.Email, new CookieOptions
                {
                    Expires = DateTime.UtcNow.AddMinutes(5),
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict
                });

                string body = VerificationEmailTemplate
                    .Replace("{{USERNAME}}", vm.RegisterVM.Username)
                    .Replace("{{CODE}}", verificationCode);

                var mail = new MailMessage();
                mail.To.Add(new MailAddress(vm.RegisterVM.Email));
                mail.Subject = "Your Verification Code: " + verificationCode;
                mail.Body = body;
                mail.IsBodyHtml = true;

                hp.SendEmail(mail);

                return RedirectToAction("VerifyEmail", new { email = vm.RegisterVM.Email });
            }
            else
            {
                string phoneNumber = vm.RegisterVM.PhonePrefix + vm.RegisterVM.Phone;

                var Customer = new Customer
                {
                    UserId = $"CUS-{today}-{nextNumber.ToString("D4")}",
                    Username = vm.RegisterVM.Username,
                    Password = hp.HashPassword(vm.RegisterVM.Password),
                    Phone = phoneNumber,
                    Gender = vm.RegisterVM.Gender!,
                    AccountStatus = "Verification",
                    Point = 0,
                    MembershipTier = "Bronze",
                    DateOfBirth = vm.RegisterVM.DateOfBirth!.Value,
                };
                db.Add(Customer);
                db.SaveChanges();

                return RedirectToAction("VerifyPhone", new { userId = Customer.UserId });
            }
        }

        [HttpGet]
        public IActionResult VerifyPhone(PhoneVerificationVM vm, string userID)
        {
            vm.UserId = userID;

            return View(vm);
        }

        [HttpPost]
        public IActionResult VerifyPhone(PhoneVerificationVM vm)
        {
            if (vm.UserId == null)
            {
                return RedirectToAction("Index", "Home");
            }

            string a1 = vm.Answer1?.Trim() ?? "";
            string a2 = vm.Answer2?.Trim() ?? "";
            string a3 = vm.Answer3?.Trim() ?? "";

            if (string.IsNullOrWhiteSpace(vm.Question1))
                ModelState.AddModelError("Question1", "Please select a question");

            if (string.IsNullOrWhiteSpace(vm.Question2))
                ModelState.AddModelError("Question2", "Please select a question");

            if (string.IsNullOrWhiteSpace(vm.Question3))
                ModelState.AddModelError("Question3", "Please select a question");

            if (string.IsNullOrWhiteSpace(a1))
                ModelState.AddModelError("Answer1", "Please provide an answer");

            if (string.IsNullOrWhiteSpace(a2))
                ModelState.AddModelError("Answer2", "Please provide an answer");

            if (string.IsNullOrWhiteSpace(a3))
                ModelState.AddModelError("Answer3", "Please provide an answer");

            if (vm.Question1 == vm.Question2 || vm.Question1 == vm.Question3 || vm.Question2 == vm.Question3)
                ModelState.AddModelError("", "Security questions cannot be duplicated.");

            if (!ModelState.IsValid)
                return View("VerifyPhone", vm);

            List<string> SecurityQuestions = [vm.Question1, vm.Question2, vm.Question3];

            List<string> SecurityAnswers = [a1, a2, a3];

            var user = db.Users.FirstOrDefault(u => u.UserId == vm.UserId);

            user!.SecurityQuestions = SecurityQuestions;
            user!.SecurityAnswer = SecurityAnswers;
            user.AccountStatus = "Active";
            db.SaveChanges();

            return RedirectToAction("Authenticate");
        }


        [HttpGet]
        public IActionResult VerifyEmail(string email)
        {
            EmailVerificationVM vm = new();
            string? savedCode = Request.Cookies["DscOtp"];
            string? savedEmail = Request.Cookies["DscOtpEmail"];

            if (savedEmail == null)
            {
                var Customer = db.Customers.FirstOrDefault(c => c.Email == email && c.AccountStatus == "Verification");

                if (Customer == null)
                {
                    return RedirectToAction("Index", "Home");
                }
                else {
                    string verificationCode = new Random().Next(100000, 999999).ToString();
                    Response.Cookies.Append("DscOtp", verificationCode, new CookieOptions
                    {
                        Expires = DateTime.UtcNow.AddMinutes(5),
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict
                    });
                    Response.Cookies.Append("DscOtpEmail", Customer.Email!, new CookieOptions
                    {
                        Expires = DateTime.UtcNow.AddMinutes(5),
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict
                    });

                    string body = VerificationEmailTemplate
                        .Replace("{{USERNAME}}", Customer.Username)
                        .Replace("{{CODE}}", verificationCode);

                    var mail = new MailMessage();
                    mail.To.Add(new MailAddress(email));
                    mail.Subject = "Your Verification Code: " + verificationCode;
                    mail.Body = body;
                    mail.IsBodyHtml = true;

                    hp.SendEmail(mail);

                    vm.SavedEmail = email;
                    vm.SavedCode = verificationCode;
                    vm.Email = Customer.Email!;

                    return View(vm);
                }
            }
            else
            {
                vm.Email = email;
                vm.SavedEmail = savedEmail;
                vm.SavedCode = savedCode!;
                return View(vm);
            }
        }

        [HttpPost]
        public IActionResult VerifyEmail(EmailVerificationVM vm)
        {
            string inputCode = vm.FirstDigit + vm.SecondDigit + vm.ThirdDigit +
                               vm.ForthDigit + vm.FifthDigit + vm.SixthDigit;

            if (vm.SavedCode == null || vm.SavedEmail == null)
            {
                ModelState.AddModelError("", "Verification code expired.");
                return View(vm);
            }

            if (!string.Equals(vm.Email?.Trim(), vm.SavedEmail?.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                ModelState.AddModelError("", "Invalid verification code.");
                return View(vm);
            }

            if (inputCode != vm.SavedCode)
            {
                ModelState.AddModelError("", "Incorrect verification code.");
                return View(vm);
            }

            var Customer = db.Customers.FirstOrDefault(u => u.Email == vm.Email);
            Customer!.AccountStatus = "Active";
            db.SaveChanges();

            Response.Cookies.Delete("DscOtp");
            Response.Cookies.Delete("DscOtpEmail");

            return RedirectToAction("Authenticate");
        }

        public IActionResult Logout()
        {
            hp.SignOut();

            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public IActionResult ForgotPassword(ForgotPasswordVM vm, string? Page)
        {

            return View(vm);
        }

        [HttpPost]
        public IActionResult ForgotPassword(ForgotPasswordVM vm)
        {
            if (vm.Email != null) {
                var user = db.Users.FirstOrDefault(u => u.Email == vm.Email);

                if (user == null)
                {
                    ModelState.AddModelError("Email", "Email not registered");
                    return View(vm);
                }

                string verificationCode = new Random().Next(100000, 999999).ToString();
                Response.Cookies.Append("DscOtp", verificationCode, new CookieOptions
                {
                    Expires = DateTime.UtcNow.AddMinutes(5),
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict
                });
                Response.Cookies.Append("DscOtpEmail", vm.Email, new CookieOptions
                {
                    Expires = DateTime.UtcNow.AddMinutes(5),
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict
                });

                string body = ResetPasswordEmailTemplate
                    .Replace("{{USERNAME}}", user.Username)
                    .Replace("{{CODE}}", verificationCode);

                var mail = new MailMessage();
                mail.To.Add(new MailAddress(vm.Email));
                mail.Subject = "Your Verification Code: " + verificationCode;
                mail.Body = body;
                mail.IsBodyHtml = true;

                hp.SendEmail(mail);
                return RedirectToAction("ResetPasswordEmail", new { email = user.Email });
            }
            if (vm.Phone != null)
            {
                string phoneNumber = vm.PhonePrefix + vm.Phone;
                var user = db.Users.FirstOrDefault(u => u.Phone == phoneNumber);

                if (user == null)
                { 
                    ModelState.AddModelError("Email", "Phone Number not registered");
                    return View(vm);
                }

                if (user.SecurityQuestions?.Count == 0 || user.SecurityQuestions == null)
                {
                    string verificationCode = new Random().Next(100000, 999999).ToString();
                    Response.Cookies.Append("DscOtp", verificationCode, new CookieOptions
                    {
                        Expires = DateTime.UtcNow.AddMinutes(5),
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict
                    });
                    Response.Cookies.Append("DscOtpEmail", user.Email!, new CookieOptions
                    {
                        Expires = DateTime.UtcNow.AddMinutes(5),
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict
                    });

                    string body = ResetPasswordEmailTemplate
                        .Replace("{{USERNAME}}", user.Username)
                        .Replace("{{CODE}}", verificationCode);

                    var mail = new MailMessage();
                    mail.To.Add(new MailAddress(vm.Email));
                    mail.Subject = "Your Verification Code: " + verificationCode;
                    mail.Body = body;
                    mail.IsBodyHtml = true;

                    hp.SendEmail(mail);
                    return RedirectToAction("ResetPasswordEmail", new { email = user.Email });
                }

                return RedirectToAction("ResetPasswordPhone", new { userId = user.UserId });
            }

            return View(vm);
        }

        [HttpGet]
        public IActionResult ResetPasswordPhone(PhoneVerificationVM vm, string userId)
        {
            vm.UserId = userId;

            return View(vm);
        }

        [HttpPost]
        public IActionResult ResetPasswordPhone(PhoneVerificationVM vm)
        {
            if (vm.UserId == null)
                return RedirectToAction("Index", "Home");

            var user = db.Users.FirstOrDefault(u => u.UserId == vm.UserId);

            if (user == null)
                return RedirectToAction("Index", "Home");

            string a1 = vm.Answer1?.Trim() ?? "";
            string a2 = vm.Answer2?.Trim() ?? "";
            string a3 = vm.Answer3?.Trim() ?? "";

            if (string.IsNullOrWhiteSpace(vm.Question1))
                ModelState.AddModelError("Question1", "Please select a question");

            if (string.IsNullOrWhiteSpace(vm.Question2))
                ModelState.AddModelError("Question2", "Please select a question");

            if (string.IsNullOrWhiteSpace(vm.Question3))
                ModelState.AddModelError("Question3", "Please select a question");

            if (string.IsNullOrWhiteSpace(a1))
                ModelState.AddModelError("Answer1", "Please provide an answer");

            if (string.IsNullOrWhiteSpace(a2))
                ModelState.AddModelError("Answer2", "Please provide an answer");

            if (string.IsNullOrWhiteSpace(a3))
                ModelState.AddModelError("Answer3", "Please provide an answer");

            if (vm.Question1 == vm.Question2 || vm.Question1 == vm.Question3 || vm.Question2 == vm.Question3)
                ModelState.AddModelError("", "Security questions cannot be duplicated.");

            if (!ModelState.IsValid)
                return View("VerifyPhone", vm);

            string Normalize(string? s)
            {
                if (s == null) return "";
                return new string(s
                    .Trim()
                    .ToLower()
                    .Where(c => !char.IsWhiteSpace(c))
                    .ToArray());
            }

            bool matchQuestions =
                Normalize(vm.Question1) == Normalize(user.SecurityQuestions![0]) &&
                Normalize(vm.Question2) == Normalize(user.SecurityQuestions[1]) &&
                Normalize(vm.Question3) == Normalize(user.SecurityQuestions[2]);

            if (!matchQuestions)
            {
                ModelState.AddModelError("", "Selected security questions do not match your registered questions.");
                return View("VerifyPhone", vm);
            }

            bool isQ1Correct = Normalize(a1) == Normalize(user.SecurityAnswer![0]);
            bool isQ2Correct = Normalize(a2) == Normalize(user.SecurityAnswer[1]);
            bool isQ3Correct = Normalize(a3) == Normalize(user.SecurityAnswer[2]);

            if (!isQ1Correct || !isQ2Correct || !isQ3Correct)
            {
                ModelState.AddModelError("", "One or more security answers are incorrect.");
                return View("VerifyPhone", vm);
            }

            return RedirectToAction("ResetPassword", new { UserId = user.UserId });
        }


        [HttpGet]
        public IActionResult ResetPasswordEmail(EmailVerificationVM vm, string email)
        {
            string? savedCode = Request.Cookies["DscOtp"];
            string? savedEmail = Request.Cookies["DscOtpEmail"];

            if (savedEmail == null || email == null)
            {
                return RedirectToAction("Index", "Home");
            }

            vm.Email = email;
            vm.SavedEmail = savedEmail;
            vm.SavedCode = savedCode!;
            return View(vm);
        }

        [HttpPost]
        public IActionResult ResetPasswordEmail(EmailVerificationVM vm)
        {
            string inputCode = vm.FirstDigit + vm.SecondDigit + vm.ThirdDigit +
                               vm.ForthDigit + vm.FifthDigit + vm.SixthDigit;

            if (vm.SavedCode == null || vm.SavedEmail == null)
            {
                ModelState.AddModelError("", "Verification code expired.");
                return View(vm);
            }

            if (!string.Equals(vm.Email?.Trim(), vm.SavedEmail?.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                ModelState.AddModelError("", "Invalid verification code.");
                return View(vm);
            }

            if (inputCode != vm.SavedCode)
            {
                ModelState.AddModelError("", "Incorrect verification code.");
                return View(vm);
            }

            var user = db.Users.FirstOrDefault(u => u.Email == vm.Email);

            Response.Cookies.Delete("DscOtp");
            Response.Cookies.Delete("DscOtpEmail");

            return RedirectToAction("ResetPassword", new { user!.UserId });
        }

        [HttpGet]
        public IActionResult ResetPassword(ForgotPasswordVM vm, string UserId)
        {
            var user = db.Users.FirstOrDefault(u => u.UserId == UserId);

            vm.Password = null;

            if (user.Email != null)
            {
                vm.Email = user.Email;
            }
            else
            {
                vm.PhonePrefix = "+60";
                vm.Phone = user.Phone!.Substring(3);
            }
            return View(vm);
        }

        [HttpPost]
        public IActionResult ResetPassword(ForgotPasswordVM vm)
        {
            if (vm.Password == null)
            {
                ModelState.AddModelError("Password", "Please enter Password");
            }

            if (vm.ConfirmPassword == null)
            {
                ModelState.AddModelError("ConfirmPassword", "Please enter Confirm Password");
            }

            if (!ModelState.IsValid)
            {
                return View(vm);
            }

            User user;

            if (vm.Email != null)
            {
                user = db.Users.FirstOrDefault(u => u.Email == vm.Email)!;
            }
            else
            {
                string phoneNumber = vm.PhonePrefix + vm.Phone;
                user = db.Users.FirstOrDefault(u => u.Phone == phoneNumber)!;
            }

            user.Password = hp.HashPassword(vm.Password!);
            db.SaveChanges();

            return RedirectToAction("Authenticate");
        }


        private const string VerificationEmailTemplate = @"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset=""UTF-8"">
                <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
                <title>Verify Your Cinema Account</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        background-color: #f5f5f5;
                        font-family: Arial, sans-serif;
                    }

                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        overflow: hidden;
                    }

                    .header {
                        background-color: #000000;
                        color: white;
                        padding: 30px 20px;
                        text-align: center;
                    }

                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                    }

                    .header p {
                        margin: 10px 0 0 0;
                        color: #cccccc;
                    }

                    .content {
                        padding: 30px;
                    }

                    .greeting {
                        margin-bottom: 20px;
                        font-size: 16px;
                    }

                    .verification-box {
                        background-color: #f8f9fa;
                        border-left: 4px solid #3BB7E5;
                        padding: 20px;
                        margin: 25px 0;
                    }

                    .verification-code {
                        font-size: 32px;
                        font-weight: bold;
                        text-align: center;
                        letter-spacing: 5px;
                        color: #333333;
                        padding: 15px;
                        background-color: white;
                        margin: 15px 0;
                        border: 1px dashed #dddddd;
                    }

                    .expiry {
                        color: #dc2626;
                        font-weight: bold;
                        text-align: center;
                        margin-top: 10px;
                    }

                    .instructions {
                        margin: 20px 0;
                        color: #666666;
                        line-height: 1.5;
                    }

                    .steps {
                        margin: 25px 0;
                    }

                    .steps h3 {
                        color: #333333;
                        margin-bottom: 10px;
                    }

                    .steps ul {
                        margin: 0;
                        padding-left: 20px;
                        color: #666666;
                    }

                    .steps li {
                        margin-bottom: 8px;
                    }

                    .footer {
                        background-color: #f1f1f1;
                        padding: 20px;
                        text-align: center;
                        color: #666666;
                        font-size: 12px;
                        border-top: 1px solid #e0e0e0;
                    }

                    .footer a {
                        color: #3BB7E5;
                        text-decoration: none;
                    }

                    @media (max-width: 600px) {
                        .content {
                            padding: 20px;
                        }
            
                        .verification-code {
                            font-size: 24px;
                            letter-spacing: 3px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class=""email-container"">
                    <div class=""header"">
                        <h1>Verify Your Account</h1>
                        <p>Diamond Screen Cinema</p>
                    </div>

                    <div class=""content"">
                        <div class=""greeting"">
                            Hello <strong>{{USERNAME}}</strong>,
                        </div>
            
                        <p>Thank you for creating an account with Diamond Screen Cinema. Please verify your email address to continue.</p>
            
                        <div class=""verification-box"">
                            <p>Your verification code:</p>
                            <div class=""verification-code"">{{CODE}}</div>
                            <p class=""expiry"">This code expires in 5 minutes</p>
                        </div>
            
                        <div class=""instructions"">
                            Enter this code on our website or app to complete your registration.
                        </div>
            
                        <div class=""steps"">
                            <h3>After verification you can:</h3>
                            <ul>
                                <li>Book movie tickets online</li>
                                <li>Get member discounts</li>
                                <li>Earn loyalty points</li>
                                <li>Save your preferences</li>
                            </ul>
                        </div>
            
                        <p style=""color: #999999; margin-top: 25px; font-size: 14px;"">
                            If you didn't create this account, please ignore this email.
                        </p>
                    </div>

                    <div class=""footer"">
                        <p><strong>Diamond Screen Cinema</strong></p>
                        <p>15, Jalan City Avenue,<br>
                        Kuala Lumpur, Malaysia, 53300</p>
                        <p>Contact: <a href=""mailto:diamondscreencinema@gmail.com"">diamondscreencinema@gmail.com</a></p>
                        <p style=""margin-top: 10px;"">
                            &copy; 2025 Diamond Screen Cinema. All rights reserved.<br>
                            This is an automated email.
                        </p>
                    </div>
                </div>
            </body>
        ";
        private const string ResetPasswordEmailTemplate = @"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset=""UTF-8"">
                <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
                <title>Reset Your Password</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        background-color: #f5f5f5;
                        font-family: Arial, sans-serif;
                    }

                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        overflow: hidden;
                    }

                    .header {
                        background-color: #000000;
                        color: white;
                        padding: 30px 20px;
                        text-align: center;
                    }

                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                    }

                    .header p {
                        margin: 10px 0 0 0;
                        color: #cccccc;
                    }

                    .content {
                        padding: 30px;
                    }

                    .greeting {
                        margin-bottom: 20px;
                        font-size: 16px;
                    }

                    .verification-box {
                        background-color: #f8f9fa;
                        border-left: 4px solid #dc2626;
                        padding: 20px;
                        margin: 25px 0;
                    }

                    .verification-code {
                        font-size: 32px;
                        font-weight: bold;
                        text-align: center;
                        letter-spacing: 5px;
                        color: #333333;
                        padding: 15px;
                        background-color: white;
                        margin: 15px 0;
                        border: 1px dashed #dddddd;
                    }

                    .expiry {
                        color: #dc2626;
                        font-weight: bold;
                        text-align: center;
                        margin-top: 10px;
                    }

                    .instructions {
                        margin: 20px 0;
                        color: #666666;
                        line-height: 1.5;
                    }

                    .steps {
                        margin: 25px 0;
                    }

                    .steps h3 {
                        color: #333333;
                        margin-bottom: 10px;
                    }

                    .steps ul {
                        margin: 0;
                        padding-left: 20px;
                        color: #666666;
                    }

                    .steps li {
                        margin-bottom: 8px;
                    }

                    .warning {
                        background-color: #fff7ed;
                        border: 1px solid #fed7aa;
                        border-radius: 6px;
                        padding: 15px;
                        margin: 20px 0;
                        color: #9a3412;
                        font-size: 14px;
                    }

                    .warning strong {
                        display: block;
                        margin-bottom: 5px;
                    }

                    .footer {
                        background-color: #f1f1f1;
                        padding: 20px;
                        text-align: center;
                        color: #666666;
                        font-size: 12px;
                        border-top: 1px solid #e0e0e0;
                    }

                    .footer a {
                        color: #3BB7E5;
                        text-decoration: none;
                    }

                    @media (max-width: 600px) {
                        .content {
                            padding: 20px;
                        }
    
                        .verification-code {
                            font-size: 24px;
                            letter-spacing: 3px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class=""email-container"">
                    <div class=""header"">
                        <h1>Reset Your Password</h1>
                        <p>Diamond Screen Cinema</p>
                    </div>

                    <div class=""content"">
                        <div class=""greeting"">
                            Hello <strong>{{USERNAME}}</strong>,
                        </div>
    
                        <p>We received a request to reset your password for your Diamond Screen Cinema account.</p>
    
                        <div class=""verification-box"">
                            <p>Your password reset verification code:</p>
                            <div class=""verification-code"">{{CODE}}</div>
                            <p class=""expiry"">This code expires in 5 minutes</p>
                        </div>
    
                        <div class=""instructions"">
                            Enter this code on our website or app to reset your password. This code is required to complete the password reset process.
                        </div>

                        <div class=""warning"">
                            <strong>⚠️ Security Notice:</strong>
                            If you didn't request a password reset, please ignore this email and ensure your account is secure. Consider changing your password if you suspect any unauthorized access.
                        </div>
    
                        <div class=""steps"">
                            <h3>To reset your password:</h3>
                            <ul>
                                <li>Go to the password reset page</li>
                                <li>Enter your email address</li>
                                <li>Enter the verification code above</li>
                                <li>Create a new strong password</li>
                                <li>Confirm your new password</li>
                            </ul>
                        </div>
    
                        <p style=""color: #999999; margin-top: 25px; font-size: 14px;"">
                            For security reasons, please do not share this code with anyone. Diamond Screen Cinema staff will never ask for this code.
                        </p>
                    </div>

                    <div class=""footer"">
                        <p><strong>Diamond Screen Cinema</strong></p>
                        <p>15, Jalan City Avenue,<br>
                        Kuala Lumpur, Malaysia, 53300</p>
                        <p>Contact: <a href=""mailto:diamondscreencinema@gmail.com"">diamondscreencinema@gmail.com</a></p>
                        <p style=""margin-top: 10px;"">
                            &copy; 2025 Diamond Screen Cinema. All rights reserved.<br>
                            This is an automated email.
                        </p>
                    </div>
                </div>
            </body>
        </html>
        ";
    }
}