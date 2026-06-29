namespace ParkingUniversitySystem.Model
{
    /// <summary>One slot currently in maintenance, with its zone -- for the admin's "État du
    /// parking" box, so they can see and clear maintenance slots without leaving the dashboard.</summary>
    public class MaintenanceSlotResponse
    {
        public int Id { get; set; }
        public string SlotNumber { get; set; } = string.Empty;
        public string AreaName { get; set; } = string.Empty;
    }
}