namespace ParkingUniversitySystem.Model
{
    /// <summary>
    /// Returned when listing areas. AvailableSlots is computed live by counting
    /// parking_slots with status = 'available' -- not a stored column, so it's
    /// always accurate at the exact moment someone checks.
    /// </summary>
    public class ParkingAreaResponse
    {
        public int Id { get; set; }
        public string AreaName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int Capacity { get; set; }
        public int AvailableSlots { get; set; }

        // Extra breakdown -- only used by the admin's "État du parking" dashboard box,
        // student/worker pages just ignore these.
        public int OccupiedSlots { get; set; }
        public int ReservedSlots { get; set; }
        public int MaintenanceSlots { get; set; }
    }
}