namespace ParkingUniversitySystem.Model
{
    /// <summary>One shift a worker has reserved for themselves on a given date.</summary>
    public class WorkerScheduleResponse
    {
        public int Id { get; set; }
        public DateTime ScheduleDate { get; set; }

        /// <summary>"morning" (07:00-14:00) or "evening" (14:00-21:00).</summary>
        public string ShiftCode { get; set; } = string.Empty;
    }
}
