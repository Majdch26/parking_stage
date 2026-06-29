using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.Engine
{
    public class ParkingEngine : IParkingEngine
    {
        private readonly IParkingRepository _parkingRepository;

        public ParkingEngine(IParkingRepository parkingRepository)
        {
            _parkingRepository = parkingRepository;
        }

        // Thin pass-through, same reasoning as the brand/model lookups in VehicleEngine.
        public Task<IEnumerable<ParkingAreaResponse>> GetAreasAsync() =>
            _parkingRepository.GetAllAreasWithAvailabilityAsync();
        public Task<IEnumerable<SlotOption>> GetAvailableSlotsAsync(int areaId) =>
            _parkingRepository.GetAvailableSlotsByAreaIdAsync(areaId);
        public Task<IEnumerable<SlotStatusResponse>> GetAllSlotsWithStatusAsync(int areaId) =>
    _parkingRepository.GetAllSlotsWithStatusByAreaIdAsync(areaId);
        public Task<IEnumerable<SlotQrInfo>> GetSlotTokensAsync(int areaId) =>
    _parkingRepository.GetSlotTokensByAreaIdAsync(areaId);
        public Task<IEnumerable<AreaQrInfo>> GetAreaTokensAsync() =>
    _parkingRepository.GetAreaTokensAsync();

        public async Task<(bool Success, string? ErrorMessage)> SetSlotMaintenanceAsync(int slotId)
        {
            var slot = await _parkingRepository.GetSlotAreaAndStatusAsync(slotId);
            if (slot is null)
            {
                return (false, "Slot not found.");
            }
            if (slot.Value.Status != "available")
            {
                return (false, $"Cannot put a slot in maintenance while it's '{slot.Value.Status}'.");
            }

            await _parkingRepository.SetSlotStatusAsync(slotId, "maintenance");
            return (true, null);
        }

        public async Task<(bool Success, string? ErrorMessage)> ClearSlotMaintenanceAsync(int slotId)
        {
            var slot = await _parkingRepository.GetSlotAreaAndStatusAsync(slotId);
            if (slot is null)
            {
                return (false, "Slot not found.");
            }
            if (slot.Value.Status != "maintenance")
            {
                return (false, "This slot isn't currently in maintenance.");
            }

            await _parkingRepository.SetSlotStatusAsync(slotId, "available");
            return (true, null);
        }

        public Task<IEnumerable<MaintenanceSlotResponse>> GetSlotsInMaintenanceAsync() =>
            _parkingRepository.GetSlotsInMaintenanceAsync();

    }


}

