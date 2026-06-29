using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.Engine
{
    public class WorkerChatEngine : IWorkerChatEngine
    {
        private const int MaxMessageLength = 1000;
        private readonly IWorkerChatRepository _chatRepository;

        public WorkerChatEngine(IWorkerChatRepository chatRepository)
        {
            _chatRepository = chatRepository;
        }

        public Task<IEnumerable<WorkerChatMessageResponse>> GetRecentAsync() =>
            _chatRepository.GetRecentAsync();

        public Task<IEnumerable<WorkerChatMessageResponse>> GetSinceAsync(int afterId) =>
            _chatRepository.GetSinceAsync(afterId);

        public async Task<(bool Success, string? ErrorMessage)> SendAsync(int senderId, string message)
        {
            var trimmed = message?.Trim() ?? string.Empty;

            if (trimmed.Length == 0)
            {
                return (false, "Message cannot be empty.");
            }

            if (trimmed.Length > MaxMessageLength)
            {
                return (false, $"Message is too long (max {MaxMessageLength} characters).");
            }

            await _chatRepository.SendAsync(senderId, trimmed);
            return (true, null);
        }
    }
}