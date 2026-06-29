namespace ParkingUniversitySystem.Model
{
    /// <summary>Maps to one row of the parking_session table -- created the moment a student scans in at the gate.</summary>
    public class ParkingSession
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int VehicleId { get; set; }
        public int? ReservationId { get; set; }
        public int? SlotId { get; set; }
        public DateTime EntryTime { get; set; }
        public DateTime? ExitTime { get; set; }

        /// <summary>One of: entered, parked, left.</summary>
        public string Status { get; set; } = "entered";

        /// <summary>EntryTime + 40 minutes -- the absolute deadline before a no-scan violation is issued.</summary>
        public DateTime? SlotScanDeadline { get; set; }
    }
}