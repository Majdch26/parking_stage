namespace ParkingUniversitySystem.Model
{
    public class VehicleModel
    {
        public int Id { get; set; }
        public int BrandId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int VehicleTypeId { get; set; }
    }
}