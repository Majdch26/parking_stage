namespace ParkingUniversitySystem.Model
{
    public class Violation
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int? WorkerId { get; set; }
        public int ViolationTypeId { get; set; }
        public int? SessionId { get; set; }
        public int PointsAtTime { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}