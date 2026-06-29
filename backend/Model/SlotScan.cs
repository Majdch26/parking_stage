namespace ParkingUniversitySystem.Model
{
    /// <summary>Maps to one row of the slot_scans table -- one attempt to scan a parking slot.</summary>
    public class SlotScan
    {
        public int Id { get; set; }
        public int SessionId { get; set; }
        public int SlotId { get; set; }
        public DateTime ScanTime { get; set; }

        /// <summary>One of: valid, wrong_slot, reserved_blocked, late_scan.</summary>
        public string Status { get; set; } = string.Empty;
    }
}
