using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface IWaitingListRepository
    {
        /// <summary>Used to enforce the same "one active reservation/request at a time" idea for the waiting list too.</summary>
        Task<bool> HasActiveEntryAsync(int userId);

        Task<int> CreateAsync(WaitingListEntry entry);

        Task<IEnumerable<WaitingListResponse>> GetByUserIdAsync(int userId);

        /// <summary>
        /// The single highest-priority waiting student across all zones, if any --
        /// ordered by PriorityTime first, then by who joined earliest as the tiebreaker.
        /// Only considers entries still 'waiting'.
        /// </summary>
        Task<WaitingListEntry?> GetNextInLineAsync();
        Task<int> GetActiveCountAsync();

        /// <summary>Marks an entry fulfilled and records which slot they got, once a real reservation is created for them.</summary>
        Task MarkFulfilledAsync(int entryId, int slotId);

        Task<bool> CancelAsync(int entryId, int userId);
        /// <summary>1-based position in the queue among everyone still 'waiting', ordered by the same
        /// priority rule used to assign slots (priority_time, then joined_at).</summary>
        /// <summary>The full waiting queue, in the exact priority order slots get assigned --
        /// used to show each student their live position relative to everyone else.</summary>
       
        Task<IEnumerable<WaitingListEntry>> GetActiveQueueAsync();
        /// <summary>Still-waiting entries whose requested time has passed but who haven't been
        /// gently reminded yet (sent once, not repeated every minute).</summary>
        Task<IEnumerable<WaitingListEntry>> GetEntriesNeedingTimePassedReminderAsync();

        Task MarkTimePassedReminderSentAsync(int entryId);
        /// <summary>Still-'waiting' entries whose requested time has already passed with no slot found.</summary>
        Task<IEnumerable<WaitingListEntry>> GetPastDueEntriesAsync();

        Task ExpireAsync(int entryId);

    }
}