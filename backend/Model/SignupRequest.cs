using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    /// <summary>
    /// Body for POST /Auth/signup. One endpoint, both students and workers --
    /// Role tells AuthEngine which person_type to match StoredId against in the university table.
    /// "admin" is rejected by UserRoles.IsValidForSignup later, not by an attribute here.
    /// </summary>
    public class SignupRequest
    {
        [Required(ErrorMessage = "University ID is required.")]
        public string StoredId { get; set; } = string.Empty;

        [Required(ErrorMessage = "First name is required.")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required.")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Role is required.")]
        public string Role { get; set; } = string.Empty;
        /// <summary>Required only when Role is "student" -- workers don't register vehicles.</summary>
        public int? ModelId { get; set; }
        public string? PlateNumber { get; set; }
        public int? Year { get; set; }
        public string? Color { get; set; }
    }
}