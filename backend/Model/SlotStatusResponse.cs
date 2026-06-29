namespace ParkingUniversitySystem.Model
{
    /// <summary>Every slot in an area with its status -- for a visual map. No slot_token exposed (that stays admin-only).</summary>
    public class SlotStatusResponse
    {
        public int Id { get; set; }
        public string SlotNumber { get; set; } = string.Empty;

        /// <summary>One of: available, occupied, reserved, maintenance.</summary>
        public string Status { get; set; } = string.Empty;
    }
}