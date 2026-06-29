namespace ParkingUniversitySystem.Model
{
    /// <summary>
    /// Returned after successful signup. Includes QrToken because that's the actual deliverable
    /// of registration -- the frontend renders it as a real QR image for the student/worker to scan at the gate.
    /// </summary>
    public class SignupResponse
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string QrToken { get; set; } = string.Empty;
    }
}