using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class WorkerScheduleController : ControllerBase
    {
        private readonly IWorkerScheduleEngine _scheduleEngine;

        public WorkerScheduleController(IWorkerScheduleEngine scheduleEngine)
        {
            _scheduleEngine = scheduleEngine;
        }

        /// <summary>GET /WorkerSchedule/week?weekStart=2026-06-29 -- this worker's reserved shifts for that Mon-Sun week.</summary>
        [HttpGet("week")]
        [Authorize(Roles = UserRoles.Worker)]
        public async Task<IActionResult> GetWeek([FromQuery] DateTime weekStart)
        {
            var workerId = GetUserId();
            if (workerId is null) return Unauthorized();

            var shifts = await _scheduleEngine.GetWeekAsync(workerId.Value, weekStart);
            return Ok(shifts);
        }

        /// <summary>POST /WorkerSchedule/toggle -- click a cell: reserves it if free, un-reserves if already yours.</summary>
        [HttpPost("toggle")]
        [Authorize(Roles = UserRoles.Worker)]
        public async Task<IActionResult> Toggle([FromBody] ToggleScheduleShiftRequest request)
        {
            var workerId = GetUserId();
            if (workerId is null) return Unauthorized();

            var (success, errorMessage, isNowReserved) =
                await _scheduleEngine.ToggleShiftAsync(workerId.Value, request.ScheduleDate, request.ShiftCode);

            if (!success) return BadRequest(new { message = errorMessage });

            return Ok(new { isReserved = isNowReserved });
        }

        /// <summary>GET /WorkerSchedule/overview?weekStart=2026-06-29 -- admin-only. Every worker's planning for that week.</summary>
        [HttpGet("overview")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> GetOverview([FromQuery] DateTime weekStart)
        {
            var entries = await _scheduleEngine.GetWeekOverviewAsync(weekStart);
            return Ok(entries);
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }
    }
}