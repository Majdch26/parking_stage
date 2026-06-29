namespace ParkingUniversitySystem.Model
{
    public class Vehicle
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int ModelId { get; set; }
        public string PlateNumber { get; set; } = string.Empty;
        public int? Year { get; set; }
        public string? Color { get; set; }
        public bool IsPrimary { get; set; }
        public string Status { get; set; } = "active";
    }
}