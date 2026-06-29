using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    public interface IActivityLogEngine
    {
        Task<IEnumerable<SessionHistoryItem>> GetAllAsync();
        Task<IEnumerable<WorkerShiftHistoryItem>> GetAllWorkerShiftsAsync();
    }
}