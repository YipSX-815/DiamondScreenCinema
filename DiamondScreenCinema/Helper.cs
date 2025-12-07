using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Net.Mail;
using System.Security.Claims;
using System.Text.Json;

public class Helper
{
    private readonly IWebHostEnvironment en;
    private readonly IHttpContextAccessor ct;
    private readonly IConfiguration cf;

    public Helper(IWebHostEnvironment en, IHttpContextAccessor ct, IConfiguration cf)
    {
        this.en = en;
        this.ct = ct;
        this.cf = cf;
    }

    private readonly PasswordHasher<object> ph = new();

    public string HashPassword(string password)
    {
        return ph.HashPassword(0, password);
    }

    public bool VerifyPassword(string hash, string password)
    {
        return ph.VerifyHashedPassword(0, hash, password)
               == PasswordVerificationResult.Success;
    }

    public void SignIn(string userId, string role, bool rememberMe)
    {
        List<Claim> claims =
        [
            new(ClaimTypes.Name, userId),
            new(ClaimTypes.Role, role),
        ];

        ClaimsIdentity identity = new(claims, "Cookies");

        ClaimsPrincipal principal = new(identity);

        AuthenticationProperties properties = new()
        {
            IsPersistent = rememberMe,
        };

        ct.HttpContext!.SignInAsync(principal, properties);
    }

    public void SignOut()
    {
        ct.HttpContext!.SignOutAsync();
    }

    public void SendEmail(MailMessage mail)
    {
        string user = cf["Smtp:User"] ?? "";
        string pass = cf["Smtp:Pass"] ?? "";
        string name = cf["Smtp:Name"] ?? "";
        string host = cf["Smtp:Host"] ?? "";
        int port = cf.GetValue<int>("Smtp:Port");

        mail.From = new MailAddress(user, name);

        using var smtp = new SmtpClient
        {
            Host = host,
            Port = port,
            EnableSsl = true,
            Credentials = new NetworkCredential(user, pass),
        };

        smtp.Send(mail);
    }

    private const string TempDataModelKey = "ViewModel";
    private const string TempDataModelStateKey = "ModelState";

    public void SaveModel<T>(ITempDataDictionary tempData, T model)
    {
        tempData[TempDataModelKey] = JsonSerializer.Serialize(model);
    }

    public T? LoadModel<T>(ITempDataDictionary tempData)
    {
        if (tempData.TryGetValue(TempDataModelKey, out var stored))
        {
            return JsonSerializer.Deserialize<T>(stored!.ToString()!);
        }
        return default;
    }

    public void SaveModelState(ITempDataDictionary tempData, ModelStateDictionary modelState)
    {
        var dict = modelState.ToDictionary(
            kv => kv.Key,
            kv => kv.Value.Errors.Select(e => e.ErrorMessage).ToArray()
        );

        tempData[TempDataModelStateKey] = JsonSerializer.Serialize(dict);
    }

    public Dictionary<string, string[]>? LoadModelState(ITempDataDictionary tempData)
    {
        if (tempData.TryGetValue(TempDataModelStateKey, out var stored))
        {
            return JsonSerializer.Deserialize<Dictionary<string, string[]>>(stored!.ToString()!);
        }

        return null;
    }
}