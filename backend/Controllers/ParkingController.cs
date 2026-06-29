using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Controllers
{
    /// <summary>Parking area visibility -- any logged-in user (student, worker, or admin) can check availability.</summary>
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class ParkingController : ControllerBase
    {
        private readonly IParkingEngine _parkingEngine;

        public ParkingController(IParkingEngine parkingEngine)
        {
            _parkingEngine = parkingEngine;
        }

        /// <summary>GET /Parking/areas -- every area with its live available slot count.</summary>
        [HttpGet("areas")]
        public async Task<IActionResult> GetAreas()
        {
            var areas = await _parkingEngine.GetAreasAsync();
            return Ok(areas);
        }

        /// <summary>GET /Parking/areas/{areaId}/slots -- individual available slots a student can choose from.</summary>
        [HttpGet("areas/{areaId}/slots")]
        public async Task<IActionResult> GetAvailableSlots(int areaId)
        {
            var slots = await _parkingEngine.GetAvailableSlotsAsync(areaId);
            return Ok(slots);
        }
        /// <summary>GET /Parking/areas/{areaId}/slots/map -- every slot's status for a visual seat-map, no secret token exposed.</summary>
        [HttpGet("areas/{areaId}/slots/map")]
        public async Task<IActionResult> GetSlotsMap(int areaId)
        {
            var slots = await _parkingEngine.GetAllSlotsWithStatusAsync(areaId);
            return Ok(slots);
        }
        /// <summary>GET /Parking/areas/{areaId}/slots/tokens -- ADMIN ONLY. Real tokens, used to print QR stickers for testing/deployment.</summary>
        [HttpGet("areas/{areaId}/slots/tokens")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> GetSlotTokens(int areaId)
        {
            var slots = await _parkingEngine.GetSlotTokensAsync(areaId);
            return Ok(slots);
        }
        /// <summary>GET /Parking/areas/tokens -- ADMIN ONLY. Zone QR tokens for printing.</summary>
        [HttpGet("areas/tokens")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> GetAreaTokens()
        {
            var areas = await _parkingEngine.GetAreaTokensAsync();
            return Ok(areas);
        }

        /// <summary>PATCH /Parking/slots/{id}/maintenance -- worker or admin takes a slot out of service.</summary>
        [HttpPatch("slots/{id}/maintenance")]
        [Authorize(Roles = "worker,admin")]
        public async Task<IActionResult> SetMaintenance(int id)
        {
            var (success, errorMessage) = await _parkingEngine.SetSlotMaintenanceAsync(id);
            if (!success) return BadRequest(new { message = errorMessage });
            return Ok(new { message = "Slot put in maintenance." });
        }

        /// <summary>PATCH /Parking/slots/{id}/available -- worker or admin brings a slot back into service.</summary>
        [HttpPatch("slots/{id}/available")]
        [Authorize(Roles = "worker,admin")]
        public async Task<IActionResult> ClearMaintenance(int id)
        {
            var (success, errorMessage) = await _parkingEngine.ClearSlotMaintenanceAsync(id);
            if (!success) return BadRequest(new { message = errorMessage });
            return Ok(new { message = "Slot back to available." });
        }

        /// <summary>GET /Parking/maintenance-slots -- every slot currently in maintenance, for the admin dashboard box.</summary>
        [HttpGet("maintenance-slots")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> GetMaintenanceSlots()
        {
            var slots = await _parkingEngine.GetSlotsInMaintenanceAsync();
            return Ok(slots);
        }
    }
}