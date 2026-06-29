using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;
using System.Linq;

namespace ParkingUniversitySystem.Engine
{
    public class AssistanceEngine : IAssistanceEngine
    {
        private readonly IAssistanceRepository _assistanceRepository;
        private readonly IWorkerShiftRepository _shiftRepository;
        private readonly INotificationRepository _notificationRepository;

        public AssistanceEngine(
            IAssistanceRepository assistanceRepository,
            IWorkerShiftRepository shiftRepository,
            INotificationRepository notificationRepository)
        {
            _assistanceRepository = assistanceRepository;
            _shiftRepository = shiftRepository;
            _notificationRepository = notificationRepository;
        }

        public async Task<AssistanceRequestResponse> CreateRequestAsync(int userId, CreateAssistanceRequestRequest request)
        {
            var requestId = await _assistanceRepository.CreateAsync(userId, request.SlotId, request.RequestType, request.Details);

            var areaId = await _assistanceRepository.GetAreaIdBySlotIdAsync(request.SlotId);
            var checkedInWorkerIds = (await _shiftRepository.GetCheckedInWorkerIdsByAreaAsync(areaId)).ToList();

            // Nobody covering this specific zone right now -- broadcast to whoever's checked in anywhere,
            // rather than letting the request go completely unanswered.
            if (checkedInWorkerIds.Count == 0)
            {
                checkedInWorkerIds = (await _shiftRepository.GetAllCheckedInWorkerIdsAsync()).ToList();
            }

            foreach (var workerId in checkedInWorkerIds)
            {
                await _notificationRepository.CreateAsync(
                    workerId, userId, "assistance",
                    $"A student needs help ({request.RequestType}) at slot id {request.SlotId}. First to accept gets it.");
            }

            var allMyRequests = await _assistanceRepository.GetMyRequestsAsync(userId);
            return allMyRequests.First(r => r.Id == requestId);
        }

        public async Task<(bool Success, string? ErrorMessage)> AcceptAsync(int workerId, int requestId)
        {
            var accepted = await _assistanceRepository.AcceptAsync(requestId, workerId);
            if (!accepted)
            {
                return (false, "This request was already accepted by someone else, or no longer exists.");
            }

            var studentId = await _assistanceRepository.GetUserIdByRequestIdAsync(requestId);
            await _notificationRepository.CreateAsync(
                studentId, workerId, "assistance", "A worker has accepted your assistance request and is on the way.");

            return (true, null);
        }

        public async Task<(bool Success, string? ErrorMessage)> ResolveAsync(int workerId, int requestId)
        {
            var resolved = await _assistanceRepository.ResolveAsync(requestId, workerId);
            if (!resolved)
            {
                return (false, "This request isn't currently assigned to you, or is already resolved.");
            }

            var studentId = await _assistanceRepository.GetUserIdByRequestIdAsync(requestId);
            await _notificationRepository.CreateAsync(
                studentId, workerId, "assistance", "Your assistance request has been resolved.");

            return (true, null);
        }

        public Task<IEnumerable<AssistanceRequestResponse>> GetMyRequestsAsync(int userId) =>
            _assistanceRepository.GetMyRequestsAsync(userId);

        public Task<IEnumerable<AssistanceRequestResponse>> GetMyAcceptedRequestsAsync(int workerId) =>
            _assistanceRepository.GetMyAcceptedRequestsAsync(workerId);

        public async Task<IEnumerable<AssistanceRequestResponse>> GetPendingRequestsAsync(int workerId)
        {
            var areaId = await _shiftRepository.GetCurrentAreaIdAsync(workerId);
            return await _assistanceRepository.GetPendingRequestsAsync(areaId);
        }
    }
}