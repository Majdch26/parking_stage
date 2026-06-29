using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.Engine
{
    public class WorkerScheduleEngine : IWorkerScheduleEngine
    {
        private static readonly string[] ValidShiftCodes = { "morning", "evening" };
        private const int MaxShiftsPerWeek = 7; // 7 shifts x 7h = 49h cap

        // Start time of each shift -- used to enforce the 24h cancellation lock.
        private static readonly Dictionary<string, TimeSpan> ShiftStartTimes = new()
        {
            ["morning"] = new TimeSpan(7, 0, 0),
            ["evening"] = new TimeSpan(14, 0, 0),
        };

        private readonly IWorkerScheduleRepository _scheduleRepository;

        public WorkerScheduleEngine(IWorkerScheduleRepository scheduleRepository)
        {
            _scheduleRepository = scheduleRepository;
        }

        public Task<IEnumerable<WorkerScheduleResponse>> GetWeekAsync(int workerId, DateTime weekStart) =>
            _scheduleRepository.GetByWorkerAndRangeAsync(workerId, weekStart.Date, weekStart.Date.AddDays(6));

        public async Task<(bool Success, string? ErrorMessage, bool IsNowReserved)> ToggleShiftAsync(int workerId, DateTime date, string shiftCode)
        {
            if (!ValidShiftCodes.Contains(shiftCode))
            {
                return (false, "Invalid shift code.", false);
            }

            var alreadyReserved = await _scheduleRepository.ExistsAsync(workerId, date, shiftCode);

            if (alreadyReserved)
            {
                var shiftStart = date.Date + ShiftStartTimes[shiftCode];
                if (shiftStart - DateTime.Now < TimeSpan.FromHours(24))
                {
                    return (false, "You can't cancel a shift within 24 hours of its start. Please contact the admin.", true);
                }

                await _scheduleRepository.UnreserveAsync(workerId, date, shiftCode);
                return (true, null, false);
            }

            // 49h weekly cap -- count this worker's shifts in the Mon-Sun week containing `date`.
            var weekStart = GetWeekStart(date);
            var weekEnd = weekStart.AddDays(6);
            var shiftsThisWeek = await _scheduleRepository.GetByWorkerAndRangeAsync(workerId, weekStart, weekEnd);
            if (shiftsThisWeek.Count() >= MaxShiftsPerWeek)
            {
                return (false, "You've already reached the 49h limit (7 shifts) for this week.", false);
            }

            await _scheduleRepository.ReserveAsync(workerId, date, shiftCode);
            return (true, null, true);
        }

        private static DateTime GetWeekStart(DateTime date)
        {
            var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
            return date.Date.AddDays(-diff);
        }

        public Task<IEnumerable<WorkerScheduleOverviewItem>> GetWeekOverviewAsync(DateTime weekStart) =>
            _scheduleRepository.GetAllForWeekAsync(weekStart.Date, weekStart.Date.AddDays(6));
    }
}