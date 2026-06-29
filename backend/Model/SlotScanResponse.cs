namespace ParkingUniversitySystem.Model
{
    public class SlotScanResponse
    {
        /// <summary>One of: valid, late_scan.</summary>
        public string Status { get; set; } = string.Empty;

        public string SlotNumber { get; set; } = string.Empty;
        public DateTime ScanTime { get; set; }
    }
}