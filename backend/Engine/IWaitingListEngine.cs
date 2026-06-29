using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    public interface IWaitingListEngine
    {
        Task<(WaitingListResponse? Success, string? ErrorMessage)> JoinAsync(int userId, JoinWaitingListRequest request);
        Task<IEnumerable<WaitingListResponse>> GetMyEntriesAsync(int userId);
        Task<(bool Success, string? ErrorMessage)> CancelAsync(int userId, int entryId);

        /// <summary>
        /// Called whenever a slot becomes available. If someone's waiting,
        /// automatically creates a real reservation for whoever's next in line and notifies them.
        /// </summary>
        Task TryAssignFreedSlotAsync(int slotId);
        Task<IEnumerable<WaitingQueueItem>> GetQueueAsync(int userId);

    }
}