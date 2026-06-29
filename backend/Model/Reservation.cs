namespace ParkingUniversitySystem.Model
{
    /// <summary>Maps to one row of the reservation table.</summary>
    public class Reservation
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int VehicleId { get; set; }
        public int SlotId { get; set; }
        public DateTime ReservationDate { get; set; }
        public TimeSpan? ScheduledEntryTime { get; set; }
        public TimeSpan? ScheduledEndTime { get; set; }

        /// <summary>One of: pending, confirmed, cancelled, expired, used.</summary>
        public string Status { get; set; } = "pending";
    }
}