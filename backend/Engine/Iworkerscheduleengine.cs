using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    public interface IWorkerScheduleEngine
    {
        Task<IEnumerable<WorkerScheduleResponse>> GetWeekAsync(int workerId, DateTime weekStart);
        Task<(bool Success, string? ErrorMessage, bool IsNowReserved)> ToggleShiftAsync(int workerId, DateTime date, string shiftCode);

        /// <summary>Every worker's planning for one week, with names -- admin-only overview.</summary>
        Task<IEnumerable<WorkerScheduleOverviewItem>> GetWeekOverviewAsync(DateTime weekStart);
    }
}