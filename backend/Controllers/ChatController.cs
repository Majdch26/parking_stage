using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Model;
using System.Security.Claims;

namespace ParkingUniversitySystem.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatEngine _chatEngine;

        public ChatController(IChatEngine chatEngine)
        {
            _chatEngine = chatEngine;
        }

        /// <summary>POST /Chat/ask -- answers a free-form question using this user's own live data as context.</summary>
        [HttpPost("ask")]
        public async Task<IActionResult> Ask([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "Message is required." });
            }

            var userId = GetUserId();
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
            if (userId is null)
            {
                return Unauthorized();
            }

            var reply = await _chatEngine.AskAsync(userId.Value, role, request.Message);
            return Ok(new ChatResponse { Reply = reply });
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }
    }
}
