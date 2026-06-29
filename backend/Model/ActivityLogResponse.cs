namespace ParkingUniversitySystem.Model
{
    public class ActivityLogResponse
    {
        public int Id { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string? SlotNumber { get; set; }
        public bool HadReservation { get; set; }
        public string Action { get; set; } = string.Empty;
        public DateTime ActionTime { get; set; }
        public string? Notes { get; set; }
    }
}