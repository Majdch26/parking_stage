namespace ParkingUniversitySystem.Model
{
    /// <summary>One worker's reserved shift, with their name attached -- the admin-wide
    /// version of WorkerScheduleResponse, used for "see every worker's planning" view.</summary>
    public class WorkerScheduleOverviewItem
    {
        public int WorkerId { get; set; }
        public string WorkerName { get; set; } = string.Empty;
        public DateTime ScheduleDate { get; set; }
        public string ShiftCode { get; set; } = string.Empty;
    }
}
