namespace ParkingUniversitySystem.Model
{
    /// <summary>One worker shift, across every worker -- the "Employés" view of the admin
    /// activity log, mirroring the student session view but for shifts instead of sessions.</summary>
    public class WorkerShiftHistoryItem
    {
        public int ShiftId { get; set; }
        public int WorkerId { get; set; }
        public string WorkerName { get; set; } = string.Empty;
        public string AreaName { get; set; } = string.Empty;
        public DateTime CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }

        /// <summary>Assistance requests this worker handled during this shift's time window.</summary>
        public List<AssistanceRequestResponse> AssistanceRequests { get; set; } = new();
    }
}