namespace ParkingUniversitySystem.Model
{
    /// <summary>Returned after reserving -- this is what the student sees as "your reserved slot."</summary>
    public class ReservationResponse
    {
        public int Id { get; set; }
        public string AreaName { get; set; } = string.Empty;
        public string SlotNumber { get; set; } = string.Empty;
        public DateTime ReservationDate { get; set; }
        public TimeSpan ScheduledEntryTime { get; set; }
        public TimeSpan ScheduledEndTime { get; set; }

        /// <summary>One of: pending, confirmed, cancelled, expired, used.</summary>
        public string Status { get; set; } = string.Empty;
    }
}