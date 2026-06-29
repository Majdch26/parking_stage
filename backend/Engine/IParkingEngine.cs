using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    public interface IParkingEngine
    {
        Task<IEnumerable<ParkingAreaResponse>> GetAreasAsync();
        Task<IEnumerable<SlotOption>> GetAvailableSlotsAsync(int areaId);
        Task<IEnumerable<SlotStatusResponse>> GetAllSlotsWithStatusAsync(int areaId);
        Task<IEnumerable<SlotQrInfo>> GetSlotTokensAsync(int areaId);
        Task<IEnumerable<AreaQrInfo>> GetAreaTokensAsync();

        /// <summary>Puts an available slot into maintenance -- blocked if it's occupied/reserved right now.</summary>
        Task<(bool Success, string? ErrorMessage)> SetSlotMaintenanceAsync(int slotId);

        /// <summary>Brings a slot back out of maintenance, making it available again.</summary>
        Task<(bool Success, string? ErrorMessage)> ClearSlotMaintenanceAsync(int slotId);

        /// <summary>Every slot currently in maintenance, for the admin dashboard box.</summary>
        Task<IEnumerable<MaintenanceSlotResponse>> GetSlotsInMaintenanceAsync();
    }
}