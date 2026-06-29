namespace ParkingUniversitySystem.Model
{
    /// <summary>Maps to one row of the parking_activity_log table.</summary>
    public class ParkingActivityLog
    {
        public int Id { get; set; }
        public int SessionId { get; set; }

        /// <summary>One of: entered, parked, left, reservation_expired, violation.</summary>
        public string Action { get; set; } = string.Empty;

        public DateTime ActionTime { get; set; }
        public string? Notes { get; set; }
    }
}