using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize(Roles = UserRoles.Admin)]
    public class AdminDashboardController : ControllerBase
    {
        private readonly IWorkerShiftEngine _shiftEngine;

        public AdminDashboardController(IWorkerShiftEngine shiftEngine)
        {
            _shiftEngine = shiftEngine;
        }

        /// <summary>GET /AdminDashboard/active-workers -- every worker on shift right now, for the live dashboard box.</summary>
        [HttpGet("active-workers")]
        public async Task<IActionResult> GetActiveWorkers()
        {
            var workers = await _shiftEngine.GetActiveWorkersAsync();
            return Ok(workers);
        }
    }
}
