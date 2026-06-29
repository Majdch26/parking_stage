namespace ParkingUniversitySystem.Model
{
    public class WorkerShiftResponse
    {
        public int Id { get; set; }
        public string AreaName { get; set; } = string.Empty;
        public DateTime CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
    }
}