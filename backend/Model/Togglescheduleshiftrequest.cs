namespace ParkingUniversitySystem.Model
{
    /// <summary>Body for POST /WorkerSchedule/toggle -- reserve a shift if free, un-reserve if already taken.</summary>
    public class ToggleScheduleShiftRequest
    {
        public DateTime ScheduleDate { get; set; }

        /// <summary>"morning" or "evening".</summary>
        public string ShiftCode { get; set; } = string.Empty;
    }
}
