using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    public interface IWorkerShiftEngine
    {
        Task<(bool Success, string? ErrorMessage)> CheckInAsync(int workerId, int areaId);
        Task<(bool Success, string? ErrorMessage)> CheckOutAsync(int workerId);
        Task<(bool Success, string? ErrorMessage)> CheckInByTokenAsync(int workerId, string areaToken);
        Task<IEnumerable<WorkerShiftResponse>> GetMyShiftsAsync(int workerId);
        Task<IEnumerable<WorkerZoneStatusResponse>> GetZonesAsync();
        Task<IEnumerable<ActiveWorkerResponse>> GetActiveWorkersAsync();
    }
}