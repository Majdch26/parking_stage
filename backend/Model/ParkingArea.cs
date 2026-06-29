namespace ParkingUniversitySystem.Model
{
    /// <summary>Maps to one row of the parking_areas table.</summary>
    public class ParkingArea
    {
        public int Id { get; set; }
        public string AreaName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int Capacity { get; set; }
    }
}