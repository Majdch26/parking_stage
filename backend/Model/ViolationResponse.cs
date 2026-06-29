namespace ParkingUniversitySystem.Model
{
    public class ViolationResponse
    {
        public int Id { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string ViolationTypeCode { get; set; } = string.Empty;
        public int Points { get; set; }
        public int PointsAtTime { get; set; }
        public bool JustBanned { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
