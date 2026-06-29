namespace ParkingUniversitySystem.Security
{
    /// <summary>
    /// Password hashing service -- uses BCrypt (one-way hash, not encryption).
    /// Hashing: password → fixed-length string stored in password_hash. Cannot be reversed.
    /// Verification: BCrypt compares the plain password to the stored hash at login time.
    /// </summary>
    public interface IPasswordHasher
    {
        string HashPassword(string plainPassword);
        bool VerifyPassword(string plainPassword, string passwordHash);
    }
}