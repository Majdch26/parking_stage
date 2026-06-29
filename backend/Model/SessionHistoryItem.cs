namespace ParkingUniversitySystem.Model
{
    /// <summary>One past gate-to-gate session, with everything that happened during it -- for the
    /// student's personal history page. Unlike the live "Ma session" view, reservation info here
    /// reflects what was actually linked to the session at entry time (the historical record),
    /// not "what's currently confirmed."</summary>
    public class SessionHistoryItem
    {
        public int SessionId { get; set; }

        // Only populated by the admin-wide activity log query -- a student's own
        // history endpoint leaves these at their defaults since it's already theirs.
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;

        public DateTime EntryTime { get; set; }
        public DateTime? ExitTime { get; set; }
        public string Status { get; set; } = string.Empty;

        public string? SlotNumber { get; set; }
        public string? AreaName { get; set; }

        public bool HasReservation { get; set; }
        public DateTime? ReservationDate { get; set; }
        public TimeSpan? ReservationTime { get; set; }
        public string? ReservationSlotNumber { get; set; }
        public string? ReservationAreaName { get; set; }

        public List<ViolationResponse> Violations { get; set; } = new();
        public List<AssistanceRequestResponse> AssistanceRequests { get; set; } = new();
    }
}