using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    /// <summary>Body for POST /User/create-worker -- admin creates a worker account directly.</summary>
    public class AdminCreateWorkerRequest
    {
        [Required] public string FirstName { get; set; } = string.Empty;
        [Required] public string LastName { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;

        /// <summary>Must already exist in the university whitelist as a "worker" person type --
        /// same rule as the public worker signup form, just filled in by the admin instead.</summary>
        [Required] public string StoredId { get; set; } = string.Empty;
    }
}