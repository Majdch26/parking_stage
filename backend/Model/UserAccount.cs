namespace ParkingUniversitySystem.Model
{
    /// <summary>
    /// Maps to one row of the users table. Every student, worker, and admin account is one row here --
    /// Role is what determines downstream behavior (only students/workers register vehicles,
    /// only admin edits everything).
    /// </summary>
    public class UserAccount
    {
        public int Id { get; set; }

        /// <summary>FK to university.id. NULL only for admin (enforced by CK_users_role_rules in SQL).</summary>
        public int? UniversityId { get; set; }

        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        /// <summary>BCrypt hash -- never returned in any API response.</summary>
        public string PasswordHash { get; set; } = string.Empty;

        /// <summary>One of UserRoles.Student / Worker / Admin.</summary>
        public string Role { get; set; } = string.Empty;

        /// <summary>Violation points. Account gets Status = "blocked" once this reaches 100.</summary>
        public int Points { get; set; }

        /// <summary>"active" or "blocked".</summary>
        public string Status { get; set; } = "active";

        /// <summary>Generated once at signup; this is what gets scanned at the entry gate.</summary>
        public string? QrToken { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}