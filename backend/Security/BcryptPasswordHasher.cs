namespace ParkingUniversitySystem.Security
{
    /// <summary>
    /// BCrypt implementation of IPasswordHasher. BCrypt automatically generates
    /// a random salt and embeds it directly inside the resulting hash string.
    /// </summary>
    public class BcryptPasswordHasher : IPasswordHasher
    {
        public string HashPassword(string plainPassword)
        {
            return BCrypt.Net.BCrypt.HashPassword(plainPassword);
        }

        public bool VerifyPassword(string plainPassword, string passwordHash)
        {
            return BCrypt.Net.BCrypt.Verify(plainPassword, passwordHash);
        }
    }
}
