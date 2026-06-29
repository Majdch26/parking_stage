using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface IWorkerShiftRepository
    {
        /// <summary>True if this area is already covered by another worker right now.</summary>
        Task<bool> IsAreaAlreadyCoveredAsync(int areaId);

        /// <summary>Sets this worker's checked_in_area_id. Fails at the database level if the area is already taken.</summary>
        Task CheckInAsync(int workerId, int areaId);

        /// <summary>Clears checked_in_area_id back to NULL.</summary>
        Task<bool> CheckOutAsync(int workerId);

        /// <summary>Every worker currently checked in, for a specific area -- used to find who to notify for an assistance request.</summary>
        Task<IEnumerable<int>> GetCheckedInWorkerIdsByAreaAsync(int areaId);

        /// <summary>Every worker currently checked in, anywhere -- used as a fallback when no one's covering the specific zone.</summary>
        Task<IEnumerable<int>> GetAllCheckedInWorkerIdsAsync();

        /// <summary>Resolves a zone's printed QR token back to its area id.</summary>
        Task<int?> GetAreaIdByTokenAsync(string areaToken);

        /// <summary>This worker's full shift history, most recent first.</summary>
        Task<IEnumerable<WorkerShiftResponse>> GetMyShiftsAsync(int workerId);
        /// <summary>This worker's currently checked-in zone, if any.</summary>
        Task<int?> GetCurrentAreaIdAsync(int workerId);

        /// <summary>Every zone with whether it's currently covered by a worker -- for the check-in picker.</summary>
        Task<IEnumerable<WorkerZoneStatusResponse>> GetZonesWithStatusAsync();

        /// <summary>Every worker with an open shift right now, for the admin's live dashboard box.</summary>
        Task<IEnumerable<ActiveWorkerResponse>> GetActiveWorkersAsync();
    }
}
