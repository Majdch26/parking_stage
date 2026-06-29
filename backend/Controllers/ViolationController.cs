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
    public class ViolationController : ControllerBase
    {
        private readonly IViolationTypeEngine _violationTypeEngine;
        private readonly IViolationEngine _violationEngine;

        public ViolationController(IViolationTypeEngine violationTypeEngine, IViolationEngine violationEngine)
        {
            _violationTypeEngine = violationTypeEngine;
            _violationEngine = violationEngine;
        }

        /// <summary>GET /Violation/types -- any logged-in user can see the rules and their point values.</summary>
        [HttpGet("types")]
        public async Task<IActionResult> GetTypes()
        {
            var types = await _violationTypeEngine.GetAllAsync();
            return Ok(types);
        }

        /// <summary>POST /Violation/types -- admin only. Defines a new violation rule and its point value.</summary>
        [HttpPost("types")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> CreateType([FromBody] CreateViolationTypeRequest request)
        {
            var (success, errorMessage) = await _violationTypeEngine.CreateAsync(request);

            if (!success)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(new { message = "Violation type created." });
        }

        /// <summary>POST /Violation -- worker or admin gives a student a violation.</summary>
        [HttpPost]
        [Authorize(Roles = "worker,admin")]
        public async Task<IActionResult> AddViolation([FromBody] AddViolationRequest request)
        {
            var workerId = GetUserId();
            if (workerId is null)
            {
                return Unauthorized();
            }

            var (response, errorMessage) = await _violationEngine.AddViolationAsync(workerId.Value, request);

            if (response is null)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(response);
        }
        /// <summary>GET /Violation/mine -- the logged-in student's own violation history, most recent first.</summary>
        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var violations = await _violationEngine.GetMyViolationsAsync(userId.Value);
            return Ok(violations);
        }
        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }
        /// <summary>GET /Violation/types/manual -- the subset of types a worker can pick when adding a violation (excludes automatic system ones).</summary>
        [HttpGet("types/manual")]
        public async Task<IActionResult> GetManualTypes()
        {
            var types = await _violationTypeEngine.GetManuallyAssignableTypesAsync();
            return Ok(types);
        }
       
    }
}