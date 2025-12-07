using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using static Helper;

namespace DiamondScreenCinema.Models;

#nullable disable warnings

public class LoginVM
{
    [EmailAddress(ErrorMessage = "Invalid Email format")]
    public string? Email { get; set; }

    [MaxLength(10, ErrorMessage = "Invalid phone number")]
    public string? Phone { get; set; }
    public string? PhonePrefix { get; set; }

    [Required(ErrorMessage = "Please enter your password")]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$",
       ErrorMessage = "Password must be at least 8 characters long, include uppercase, lowercase, number and special character")]
    public string Password { get; set; }
    public bool RememberMe { get; set; }
}

public class RegisterVM
{
    [Required(ErrorMessage = "Please enter Username")]
    public string Username { get; set; }

    [Required(ErrorMessage = "Please select your Gender")]
    public string Gender { get; set; }

    [EmailAddress(ErrorMessage = "Invalid Email format")]
    public string? Email { get; set; }

    [MaxLength(10, ErrorMessage = "Invalid Phone Number")]
    public string? Phone { get; set; }
    public string? PhonePrefix { get; set; }

    [Required(ErrorMessage = "Please select your Date of Birth")]
    public DateTime? DateOfBirth { get; set; }

    [Required(ErrorMessage = "Please enter Password")]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$",
        ErrorMessage = "Password must be at least 8 characters long, include uppercase, lowercase, number and special character")]
    public string Password { get; set; }

    [Required(ErrorMessage = "Please enter Confirm Password")]
    [Compare("Password", ErrorMessage = "Password do not match")]
    public string ConfirmPassword { get; set; }
}

public class AuthenticateVM
{
    public LoginVM LoginVM { get; set; }
    public RegisterVM RegisterVM { get; set; }

    public bool ShowRegister { get; set; }
}

public class EmailVerificationVM
{
    public string Email { get; set; }
    public string SavedEmail { get; set; }
    public string SavedCode { get; set; }
    public string FirstDigit { get; set; }
    public string SecondDigit { get; set; }
    public string ThirdDigit { get; set; }
    public string ForthDigit { get; set; }
    public string FifthDigit { get; set; }
    public string SixthDigit { get; set; }
}

public class PhoneVerificationVM
{
    public string UserId { get; set; }
    public List<string> AvailableQuestions { get; set; } = new()
    {
        "What is your favourite movie?",
        "What was the name of your first pet?",
        "What city were you born in?",
        "What is your mother's maiden name?",
        "What is your favourite food?",
        "What is your dream travel destination?"
    };

    [Required(ErrorMessage = "Please select question 1")]
    public string Question1 { get; set; }

    [Required(ErrorMessage = "Please enter your answer")]
    public string Answer1 { get; set; }

    [Required(ErrorMessage = "Please select question 2")]
    public string Question2 { get; set; }

    [Required(ErrorMessage = "Please enter your answer")]
    public string Answer2 { get; set; }

    [Required(ErrorMessage = "Please select question 3")]
    public string Question3 { get; set; }

    [Required(ErrorMessage = "Please enter your answer")]
    public string Answer3 { get; set; }
}

public class MovieVM
{
    public string? MovieId { get; set; }

    public string Title { get; set; }
    public string Genre { get; set; }
    public int Duration { get; set; }
    public string Language { get; set; }
    public string Director { get; set; }
    public string Cast { get; set; }
    public string Classification { get; set; }
    public string Subtitle { get; set; }
    public DateTime ReleaseDate { get; set; }
    public string Status { get; set; }
    public string? Synopsis { get; set; }

    public string? Poster { get; set; }
    public string? Trailer { get; set; }
    public string? HorizontalPoster { get; set; }

    [JsonIgnore]
    public IFormFile? PosterFile { get; set; }
    [JsonIgnore]
    public IFormFile? TrailerFile { get; set; }
    [JsonIgnore]
    public IFormFile? HorizontalPosterFile { get; set; }
}

public class UpdateStatusRequest
{
    public string Id { get; set; }
    public string Status { get; set; }
}

public class HomeViewModel
{
    public List<Movie> HeroMovies { get; set; } = new List<Movie>();
    public List<Movie> Top3Movies { get; set; } = new List<Movie>();
    public List<Movie> NowShowingMovies { get; set; } = new List<Movie>();
    public List<Movie> ComingSoonMovies { get; set; } = new List<Movie>();
}

public class MovieMenuViewModel
{
    public List<Movie> ShowingNowMovies { get; set; } = new List<Movie>();
    public List<Movie> ComingSoonMovies { get; set; } = new List<Movie>();
    public List<Movie> TopRatedMovies { get; set; } = new List<Movie>();
}