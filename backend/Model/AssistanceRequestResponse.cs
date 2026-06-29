namespace ParkingUniversitySystem.Model
{
    public class AssistanceRequestResponse
    {
        public int Id { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string AreaName { get; set; } = string.Empty;
        public string SlotNumber { get; set; } = string.Empty;
        public string RequestType { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? WorkerName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
}