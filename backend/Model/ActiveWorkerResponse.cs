namespace ParkingUniversitySystem.Model
{
    /// <summary>One worker currently checked in somewhere right now -- for the admin's live dashboard box.</summary>
    public class ActiveWorkerResponse
    {
        public int WorkerId { get; set; }
        public string WorkerName { get; set; } = string.Empty;
        public string AreaName { get; set; } = string.Empty;
        public DateTime CheckInTime { get; set; }
    }
}
