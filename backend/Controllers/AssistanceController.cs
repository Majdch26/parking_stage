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
    public class AssistanceController : ControllerBase
    {
        private readonly IAssistanceEngine _assistanceEngine;

        public AssistanceController(IAssistanceEngine assistanceEngine)
        {
            _assistanceEngine = assistanceEngine;
        }

        /// <summary>POST /Assistance -- student requests help at the slot they're at.</summary>
        [HttpPost]
        [Authorize(Roles = UserRoles.Student)]
        public async Task<IActionResult> Create([FromBody] CreateAssistanceRequestRequest request)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var response = await _assistanceEngine.CreateRequestAsync(userId.Value, request);
            return Ok(response);
        }

        /// <summary>GET /Assistance/mine -- student's own requests, with live status.</summary>
        [HttpGet("mine")]
        [Authorize(Roles = UserRoles.Student)]
        public async Task<IActionResult> GetMine()
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var requests = await _assistanceEngine.GetMyRequestsAsync(userId.Value);
            return Ok(requests);
        }

        /// <summary>GET /Assistance/pending -- worker sees unclaimed requests, scoped to their checked-in zone if any.</summary>
        [HttpGet("pending")]
        [Authorize(Roles = UserRoles.Worker)]
        public async Task<IActionResult> GetPending()
        {
            var workerId = GetUserId();
            if (workerId is null) return Unauthorized();

            var requests = await _assistanceEngine.GetPendingRequestsAsync(workerId.Value);
            return Ok(requests);
        }

        /// <summary>GET /Assistance/my-accepted -- requests this worker has personally accepted.</summary>
        [HttpGet("my-accepted")]
        [Authorize(Roles = UserRoles.Worker)]
        public async Task<IActionResult> GetMyAccepted()
        {
            var workerId = GetUserId();
            if (workerId is null) return Unauthorized();

            var requests = await _assistanceEngine.GetMyAcceptedRequestsAsync(workerId.Value);
            return Ok(requests);
        }

        /// <summary>POST /Assistance/{id}/accept -- first checked-in worker to click wins it.</summary>
        [HttpPost("{id}/accept")]
        [Authorize(Roles = UserRoles.Worker)]
        public async Task<IActionResult> Accept(int id)
        {
            var workerId = GetUserId();
            if (workerId is null) return Unauthorized();

            var (success, errorMessage) = await _assistanceEngine.AcceptAsync(workerId.Value, id);
            if (!success) return BadRequest(new { message = errorMessage });

            return Ok(new { message = "Request accepted." });
        }

        /// <summary>POST /Assistance/{id}/resolve -- worker marks the request as resolved.</summary>
        [HttpPost("{id}/resolve")]
        [Authorize(Roles = UserRoles.Worker)]
        public async Task<IActionResult> Resolve(int id)
        {
            var workerId = GetUserId();
            if (workerId is null) return Unauthorized();

            var (success, errorMessage) = await _assistanceEngine.ResolveAsync(workerId.Value, id);
            if (!success) return BadRequest(new { message = errorMessage });

            return Ok(new { message = "Request resolved." });
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }
    }
}