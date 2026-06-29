namespace ParkingUniversitySystem.Model
{
    public class ViolationType
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int Points { get; set; }
    }
}
