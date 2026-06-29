using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize(Roles = UserRoles.Worker)]
    public class WorkerShiftController : ControllerBase
    {
        private readonly IWorkerShiftEngine _shiftEngine;

        public WorkerShiftController(IWorkerShiftEngine shiftEngine)
        {
            _shiftEngine = shiftEngine;
        }

        /// <summary>POST /WorkerShift/check-in -- worker picks which zone they're covering this shift.</summary>
        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInRequest request)
        {
            var workerId = GetUserId();
            if (workerId is null) return Unauthorized();

            var (success, errorMessage) = await _shiftEngine.CheckInAsync(workerId.Value, request.AreaId);
            if (!success) return BadRequest(new { message = errorMessage });

            return Ok(new { message = "Checked in successfully." });
        }

        /// <summary>POST /WorkerShift/check-out -- ends the worker's shift, freeing their zone for someone else.</summary>
        [HttpPost("check-out")]
        public async Task<IActionResult> CheckOut()
        {
            var workerId = GetUserId();
            if (workerId is null) return Unauthorized();

            var (success, errorMessage) = await _shiftEngine.CheckOutAsync(workerId.Value);
            if (!success) return BadRequest(new { message = errorMessage });

            return Ok(new { message = "Checked out successfully." });
        }
        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }
        /// <summary>POST /WorkerShift/check-in/scan -- worker scans the zone's printed QR sticker.</summary>
        [HttpPost("check-in/scan")]
        public async Task<IActionResult> CheckInByScan([FromBody] CheckInByTokenRequest request)
        {
            var workerId = GetUserId();
            if (workerId is null) return Unauthorized();

            var (success, errorMessage) = await _shiftEngine.CheckInByTokenAsync(workerId.Value, request.AreaToken);
            if (!success) return BadRequest(new { message = errorMessage });

            return Ok(new { message = "Checked in successfully." });
        }

        /// <summary>GET /WorkerShift/mine -- this worker's full check-in/check-out history.</summary>
        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            var workerId = GetUserId();
            if (workerId is null) return Unauthorized();

            var shifts = await _shiftEngine.GetMyShiftsAsync(workerId.Value);
            return Ok(shifts);
        }

        /// <summary>GET /WorkerShift/zones -- every zone with whether it's free or already covered, for the check-in picker.</summary>
        [HttpGet("zones")]
        public async Task<IActionResult> GetZones()
        {
            var zones = await _shiftEngine.GetZonesAsync();
            return Ok(zones);
        }

        /// <summary>GET /WorkerShift/status -- am I currently checked in right now? Used to gate other worker actions.</summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var workerId = GetUserId();
            if (workerId is null) return Unauthorized();

            var shifts = await _shiftEngine.GetMyShiftsAsync(workerId.Value);
            var current = shifts.FirstOrDefault(s => s.CheckOutTime is null);
            return Ok(new { isCheckedIn = current is not null, shift = current });
        }
    }
}