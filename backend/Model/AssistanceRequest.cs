namespace ParkingUniversitySystem.Model
{
    /// <summary>Maps to one row of the assistance_requests table.</summary>
    public class AssistanceRequest
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int SlotId { get; set; }

        /// <summary>One of: parking_help, accident, security_issue, car_problem, other.</summary>
        public string RequestType { get; set; } = string.Empty;

        /// <summary>One of: pending, in_progress, resolved.</summary>
        public string Status { get; set; } = "pending";

        public int? WorkerId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
}