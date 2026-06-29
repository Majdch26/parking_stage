using Microsoft.Data.SqlClient;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.Engine
{
    public class WorkerShiftEngine : IWorkerShiftEngine
    {
        private readonly IWorkerShiftRepository _shiftRepository;
        private readonly IUserRepository _userRepository;

        public WorkerShiftEngine(IWorkerShiftRepository shiftRepository, IUserRepository userRepository)
        {
            _shiftRepository = shiftRepository;
            _userRepository = userRepository;
        }

        public async Task<(bool Success, string? ErrorMessage)> CheckInAsync(int workerId, int areaId)
        {
            var worker = await _userRepository.GetByIdAsync(workerId);
            if (worker is null)
            {
                return (false, "Worker not found.");
            }

            if (worker.Status == "blocked")
            {
                return (false, "You are banned and cannot check in.");
            }

            var currentAreaId = await _shiftRepository.GetCurrentAreaIdAsync(workerId);
            if (currentAreaId is not null)
            {
                return (false, "You are already checked in. Please check out first.");
            }

            if (await _shiftRepository.IsAreaAlreadyCoveredAsync(areaId))
            {
                return (false, "This zone is already covered by another worker right now.");
            }

            try
            {
                await _shiftRepository.CheckInAsync(workerId, areaId);
                return (true, null);
            }
            catch (SqlException ex) when (ex.Number == 2601 || ex.Number == 2627)
            {
                // The IsAreaAlreadyCoveredAsync check above passed, but another worker's
                // check-in landed first in the brief gap between that check and this update --
                // the database's UNIQUE index caught it here instead, as the real backstop.
                return (false, "This zone was just taken by another worker. Please pick a different zone.");
            }
        }

        public async Task<(bool Success, string? ErrorMessage)> CheckOutAsync(int workerId)
        {
            var checkedOut = await _shiftRepository.CheckOutAsync(workerId);
            return checkedOut ? (true, null) : (false, "You are not currently checked in.");
        }
        public async Task<(bool Success, string? ErrorMessage)> CheckInByTokenAsync(int workerId, string areaToken)
        {
            var areaId = await _shiftRepository.GetAreaIdByTokenAsync(areaToken);
            if (areaId is null)
            {
                return (false, "Invalid zone code.");
            }
            return await CheckInAsync(workerId, areaId.Value);
        }

        public Task<IEnumerable<WorkerShiftResponse>> GetMyShiftsAsync(int workerId) =>
            _shiftRepository.GetMyShiftsAsync(workerId);

        public Task<IEnumerable<WorkerZoneStatusResponse>> GetZonesAsync() =>
            _shiftRepository.GetZonesWithStatusAsync();

        public Task<IEnumerable<ActiveWorkerResponse>> GetActiveWorkersAsync() =>
            _shiftRepository.GetActiveWorkersAsync();
    }
}