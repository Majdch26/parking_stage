// AdminResetPasswordRequest.cs
using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    public class AdminResetPasswordRequest
    {
        [Required(ErrorMessage = "New password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        public string NewPassword { get; set; } = string.Empty;
    }
}