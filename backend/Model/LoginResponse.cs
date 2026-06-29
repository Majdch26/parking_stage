namespace ParkingUniversitySystem.Model
{
    /// <summary>Returned after successful login. Frontend stores Token and sends it as a Bearer header on every later request.</summary>
    public class LoginResponse
    {
        public int Id { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAtUtc { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
