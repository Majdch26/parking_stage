namespace ParkingUniversitySystem.Model
{
    public class VehicleResponse
    {
        public int Id { get; set; }
        public string PlateNumber { get; set; } = string.Empty;
        public int? Year { get; set; }
        public string? Color { get; set; }
        public bool IsPrimary { get; set; }
        public string Status { get; set; } = "active";
        public string BrandName { get; set; } = string.Empty;
        public string ModelName { get; set; } = string.Empty;
        public string VehicleTypeName { get; set; } = string.Empty;
    }
}