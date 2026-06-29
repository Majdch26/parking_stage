using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface IParkingSessionRepository
    {
        /// <summary>The student's currently active reservation for right now, if any -- used to resolve vehicle/slot at entry.</summary>
        Task<Reservation?> GetActiveReservationForEntryAsync(int userId);

        /// <summary>Creates the session row at the moment of entry.</summary>
        Task<int> CreateSessionAsync(ParkingSession session);
        /// <summary>The student's currently active, un-exited session, if any -- used to know which entry this scan belongs to.</summary>
        Task<ParkingSession?> GetActiveSessionByUserIdAsync(int userId);
        /// <summary>The student's own most recent session, regardless of status -- lets them check where they're currently parked.</summary>
        Task<SessionStatusResponse?> GetMostRecentSessionStatusByUserIdAsync(int userId);
        /// <summary>The student's currently open session (entered or parked, not yet left) -- used to know what to close out on exit.</summary>
        Task<ParkingSession?> GetOpenSessionByUserIdAsync(int userId);

        /// <summary>
        /// Marks the session 'left', frees its slot back to 'available' if one was assigned,
        /// and marks any linked reservation 'used' -- all in one transaction.
        /// </summary>
        Task<(DateTime ExitTime, int? SlotId, int? AreaId)> ExitAsync(int sessionId);
        Task<IEnumerable<ParkingSession>> GetSessionsNeedingScanReminderAsync();
        /// <summary>Sessions still 'entered' whose full 40-minute deadline has passed, with no no_scan violation issued yet for this session.</summary>
        Task<IEnumerable<ParkingSession>> GetSessionsPastDeadlineAsync();
        Task<int> GetUserIdBySessionIdAsync(int sessionId);
        /// <summary>Every past session for this student (after their last "clear history"), each with its
        /// own slot scan, reservation snapshot, violations, and assistance requests.</summary>
        Task<IEnumerable<SessionHistoryItem>> GetHistoryByUserIdAsync(int userId);

        /// <summary>Marks "everything before now" as cleared for this student -- non-destructive,
        /// just hides it from the history view going forward.</summary>
        Task ClearHistoryAsync(int userId);
    }
}
