using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    public interface IAssistanceEngine
    {
        Task<AssistanceRequestResponse> CreateRequestAsync(int userId, CreateAssistanceRequestRequest request);
        Task<(bool Success, string? ErrorMessage)> AcceptAsync(int workerId, int requestId);
        Task<(bool Success, string? ErrorMessage)> ResolveAsync(int workerId, int requestId);
        Task<IEnumerable<AssistanceRequestResponse>> GetMyRequestsAsync(int userId);
        Task<IEnumerable<AssistanceRequestResponse>> GetMyAcceptedRequestsAsync(int workerId);
        Task<IEnumerable<AssistanceRequestResponse>> GetPendingRequestsAsync(int workerId);
    }
}