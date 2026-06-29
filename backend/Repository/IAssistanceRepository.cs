using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface IAssistanceRepository
    {
        Task<int> GetAreaIdBySlotIdAsync(int slotId);
        Task<int> CreateAsync(int userId, int slotId, string requestType, string? details);
        Task<bool> AcceptAsync(int requestId, int workerId);
        Task<bool> ResolveAsync(int requestId, int workerId);
        Task<IEnumerable<AssistanceRequestResponse>> GetMyRequestsAsync(int userId);
        Task<IEnumerable<AssistanceRequestResponse>> GetMyAcceptedRequestsAsync(int workerId);
        Task<int> GetUserIdByRequestIdAsync(int requestId);

        /// <summary>Still-unclaimed requests, scoped to a zone when the worker is checked into one,
        /// otherwise every pending request anywhere.</summary>
        Task<IEnumerable<AssistanceRequestResponse>> GetPendingRequestsAsync(int? areaId);
    }
}