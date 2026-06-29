namespace ParkingUniversitySystem.Model
{
    /// <summary>One zone in the worker check-in picker -- whether it's free or already covered.</summary>
    public class WorkerZoneStatusResponse
    {
        public int AreaId { get; set; }
        public string AreaName { get; set; } = string.Empty;
        public bool IsCovered { get; set; }
    }
}
