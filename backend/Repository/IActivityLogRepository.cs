using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface IActivityLogRepository
    {
        /// <summary>Every session, across every student, with its full timeline (entry/slot/exit,
        /// reservation, violations, assistance requests) -- the "Étudiants" view.</summary>
        Task<IEnumerable<SessionHistoryItem>> GetAllAsync();

        /// <summary>Every shift, across every worker, with assistance requests they handled
        /// during it -- the "Employés" view.</summary>
        Task<IEnumerable<WorkerShiftHistoryItem>> GetAllWorkerShiftsAsync();
    }
}