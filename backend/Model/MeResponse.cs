namespace ParkingUniversitySystem.Model
{
    /// <summary>Returned by GET /Auth/me -- lets a logged-in user see their own profile, including their QR code if they have one.</summary>
    public class MeResponse
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int Points { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? QrToken { get; set; }
    }
}