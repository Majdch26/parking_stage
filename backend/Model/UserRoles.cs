using System.Linq;

namespace ParkingUniversitySystem.Model
{
    /// <summary>
    /// Allowed role values stored in users.role and embedded in the JWT as a role claim.
    /// [Authorize(Roles = UserRoles.Admin)] checks this value on every protected request.
    /// </summary>
    public static class UserRoles
    {
        public const string Student = "student";
        public const string Worker = "worker";
        public const string Admin = "admin";

        /// <summary>All valid roles for the users table.</summary>
        public static readonly string[] All = [Student, Worker, Admin];

        /// <summary>Roles allowed to self-register through /Auth/signup -- admin is excluded on purpose.</summary>
        public static readonly string[] SignupRoles = [Student, Worker];

        public static bool IsValid(string? role) =>
            !string.IsNullOrWhiteSpace(role) && All.Contains(role, StringComparer.OrdinalIgnoreCase);

        /// <summary>Used by AuthEngine to reject "admin" (or anything else) at signup, before touching the database.</summary>
        public static bool IsValidForSignup(string? role) =>
            !string.IsNullOrWhiteSpace(role) && SignupRoles.Contains(role, StringComparer.OrdinalIgnoreCase);
    }
}