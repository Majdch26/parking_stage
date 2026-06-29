using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize(Roles = UserRoles.Student)]
    public class WaitingListController : ControllerBase
    {
        private readonly IWaitingListEngine _waitingListEngine;

        public WaitingListController(IWaitingListEngine waitingListEngine)
        {
            _waitingListEngine = waitingListEngine;
        }

        [HttpPost]
        public async Task<IActionResult> Join([FromBody] JoinWaitingListRequest request)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var (response, errorMessage) = await _waitingListEngine.JoinAsync(userId.Value, request);
            if (response is null) return BadRequest(new { message = errorMessage });

            return Ok(response);
        }

        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var entries = await _waitingListEngine.GetMyEntriesAsync(userId.Value);
            return Ok(entries);
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var (success, errorMessage) = await _waitingListEngine.CancelAsync(userId.Value, id);
            if (!success) return BadRequest(new { message = errorMessage });

            return Ok(new { message = "Removed from waiting list." });
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }
        [HttpGet("queue")]
        public async Task<IActionResult> GetQueue()
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var queue = await _waitingListEngine.GetQueueAsync(userId.Value);
            return Ok(queue);
        }
    }
}