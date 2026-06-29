using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize(Roles = UserRoles.Admin)]
    public class ActivityLogController : ControllerBase
    {
        private readonly IActivityLogEngine _activityLogEngine;

        public ActivityLogController(IActivityLogEngine activityLogEngine)
        {
            _activityLogEngine = activityLogEngine;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var log = await _activityLogEngine.GetAllAsync();
            return Ok(log);
        }

        /// <summary>GET /ActivityLog/workers -- the "Employés" toggle view, same idea but for worker shifts.</summary>
        [HttpGet("workers")]
        public async Task<IActionResult> GetAllWorkerShifts()
        {
            var shifts = await _activityLogEngine.GetAllWorkerShiftsAsync();
            return Ok(shifts);
        }
    }
}