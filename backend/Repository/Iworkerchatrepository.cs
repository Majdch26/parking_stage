using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface IWorkerChatRepository
    {
        /// <summary>Most recent messages, oldest first (ready to render top-to-bottom).</summary>
        Task<IEnumerable<WorkerChatMessageResponse>> GetRecentAsync(int take = 100);

        /// <summary>Only messages newer than `afterId` -- used for cheap polling instead of re-fetching everything.</summary>
        Task<IEnumerable<WorkerChatMessageResponse>> GetSinceAsync(int afterId);

        Task<int> SendAsync(int senderId, string message);
    }
}