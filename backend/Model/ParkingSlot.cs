namespace ParkingUniversitySystem.Model
{
    /// <summary>Maps to one row of the parking_slots table -- SlotToken is the QR code physically printed on the slot.</summary>
    public class ParkingSlot
    {
        public int Id { get; set; }
        public int AreaId { get; set; }
        public string SlotNumber { get; set; } = string.Empty;

        /// <summary>One of: available, occupied, reserved, maintenance.</summary>
        public string Status { get; set; } = "available";

        public string? SlotToken { get; set; }
    }
}