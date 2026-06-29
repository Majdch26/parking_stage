using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    /// <summary>Admin-only view of a user -- never includes password_hash or qr_token.</summary>
    public class UserSummaryResponse
    {
        public int Id { get; set; }

        /// <summary>The university's own ID (e.g. "S1003" or "W1001") -- null only for admin,
        /// since admin accounts aren't tied to a university record.</summary>
        public string? StoredId { get; set; }

        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int Points { get; set; }
        public string Status { get; set; } = string.Empty;
    }
    /// <summary>Body for PUT /User/{id} -- admin edits a user's basic info.</summary>
    public class UpdateUserRequest
    {
        [Required(ErrorMessage = "First name is required.")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required.")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}