namespace ParkingUniversitySystem.Model
{
    /// <summary>
    /// Everything about the student's current/most recent gate-to-gate session: entry, slot scan,
    /// exit, the reservation (if any), and every violation/assistance request raised during it.
    /// Resets to a fresh empty state once the student exits. Reservation info is independent of
    /// all of this -- it shows as soon as it's confirmed and disappears once it's no longer confirmed.
    /// </summary>
    public class SessionStatusResponse
    {
        public int SessionId { get; set; }
        public DateTime? EntryTime { get; set; }

        /// <summary>When the student scanned the slot sticker -- null until they actually scan.</summary>
        public DateTime? SlotScanTime { get; set; }
        public DateTime? ExitTime { get; set; }

        /// <summary>One of: entered, parked, left.</summary>
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