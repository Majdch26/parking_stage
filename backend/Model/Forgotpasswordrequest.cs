using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    /// <summary>Body for POST /Auth/forgot-password. No email is sent -- identity is proven by
    /// matching the account's email AND university ID together, same proof-of-identity the
    /// university whitelist already provides at signup.</summary>
    public class ForgotPasswordRequest
    {
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required] public string StoredId { get; set; } = string.Empty;
        [Required, MinLength(6)] public string NewPassword { get; set; } = string.Empty;
    }
}
