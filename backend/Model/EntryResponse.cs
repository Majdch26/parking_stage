namespace ParkingUniversitySystem.Model
{
    public class EntryResponse
    {
        public int SessionId { get; set; }
        public DateTime EntryTime { get; set; }

        /// <summary>EntryTime + 40 minutes -- the deadline before a no-scan violation.</summary>
        public DateTime SlotScanDeadline { get; set; }

        public bool HasReservation { get; set; }
        public int? ReservedSlotId { get; set; }
    }
}