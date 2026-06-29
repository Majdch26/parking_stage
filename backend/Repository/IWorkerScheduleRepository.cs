using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface IWorkerScheduleRepository
    {
        /// <summary>This worker's reserved shifts between two dates (inclusive) -- typically one calendar week.</summary>
        Task<IEnumerable<WorkerScheduleResponse>> GetByWorkerAndRangeAsync(int workerId, DateTime from, DateTime to);

        /// <summary>True if this worker already reserved this exact date+shift.</summary>
        Task<bool> ExistsAsync(int workerId, DateTime date, string shiftCode);

        Task ReserveAsync(int workerId, DateTime date, string shiftCode);
        Task UnreserveAsync(int workerId, DateTime date, string shiftCode);

        /// <summary>Every worker id, for the Sunday "fill in next week" reminder.</summary>
        Task<IEnumerable<int>> GetAllWorkerIdsAsync();

        /// <summary>Every worker's reserved shifts in one week, with their names -- for the admin's "see everyone's planning" view.</summary>
        Task<IEnumerable<WorkerScheduleOverviewItem>> GetAllForWeekAsync(DateTime from, DateTime to);
    }
}