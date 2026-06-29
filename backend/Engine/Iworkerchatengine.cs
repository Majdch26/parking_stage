using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    public interface IWorkerChatEngine
    {
        Task<IEnumerable<WorkerChatMessageResponse>> GetRecentAsync();
        Task<IEnumerable<WorkerChatMessageResponse>> GetSinceAsync(int afterId);
        Task<(bool Success, string? ErrorMessage)> SendAsync(int senderId, string message);
    }
}

