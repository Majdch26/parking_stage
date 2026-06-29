using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface IParkingRepository
    {
        /// <summary>All areas, each with its live count of available slots.</summary>
        Task<IEnumerable<ParkingAreaResponse>> GetAllAreasWithAvailabilityAsync();
        /// <summary>Available slots in one area -- shown to the student to pick from before reserving.</summary>
        Task<IEnumerable<SlotOption>> GetAvailableSlotsByAreaIdAsync(int areaId);
        /// <summary>Every slot in an area with its status, no secret token -- for a visual seat-map style display.</summary>
        Task<IEnumerable<SlotStatusResponse>> GetAllSlotsWithStatusByAreaIdAsync(int areaId);
        /// <summary>Admin-only: every slot in an area WITH its token, used to print/display QR codes for testing.</summary>
        Task<IEnumerable<SlotQrInfo>> GetSlotTokensByAreaIdAsync(int areaId);
        Task<IEnumerable<AreaQrInfo>> GetAreaTokensAsync();

        /// <summary>The area + current status of one slot -- used to validate a maintenance toggle before applying it.</summary>
        Task<(int AreaId, string Status)?> GetSlotAreaAndStatusAsync(int slotId);

        /// <summary>Sets a slot's status directly -- used for the maintenance on/off toggle.</summary>
        Task SetSlotStatusAsync(int slotId, string status);

        /// <summary>Every slot currently in maintenance, across every zone -- for the admin dashboard box.</summary>
        Task<IEnumerable<MaintenanceSlotResponse>> GetSlotsInMaintenanceAsync();
    }
}