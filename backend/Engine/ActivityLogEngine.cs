using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.Engine
{
    public class ActivityLogEngine : IActivityLogEngine
    {
        private readonly IActivityLogRepository _activityLogRepository;

        public ActivityLogEngine(IActivityLogRepository activityLogRepository)
        {
            _activityLogRepository = activityLogRepository;
        }

        public Task<IEnumerable<SessionHistoryItem>> GetAllAsync() =>
            _activityLogRepository.GetAllAsync();

        public Task<IEnumerable<WorkerShiftHistoryItem>> GetAllWorkerShiftsAsync() =>
            _activityLogRepository.GetAllWorkerShiftsAsync();
    }
}