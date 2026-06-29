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
    public class WorkerChatController : ControllerBase
    {
        private readonly IWorkerChatEngine _chatEngine;

        public WorkerChatController(IWorkerChatEngine chatEngine)
        {
            _chatEngine = chatEngine;
        }

        /// <summary>GET /WorkerChat/messages -- the last 100 messages, oldest first.</summary>
        [HttpGet("messages")]
        public async Task<IActionResult> GetMessages()
        {
            var messages = await _chatEngine.GetRecentAsync();
            return Ok(messages);
        }

        /// <summary>GET /WorkerChat/messages/since/{afterId} -- cheap polling: only new messages.</summary>
        [HttpGet("messages/since/{afterId:int}")]
        public async Task<IActionResult> GetSince(int afterId)
        {
            var messages = await _chatEngine.GetSinceAsync(afterId);
            return Ok(messages);
        }

        /// <summary>POST /WorkerChat/messages -- send a message to the shared worker group chat.</summary>
        [HttpPost("messages")]
        public async Task<IActionResult> SendMessage([FromBody] SendWorkerChatMessageRequest request)
        {
            var senderId = GetUserId();
            if (senderId is null) return Unauthorized();

            var (success, errorMessage) = await _chatEngine.SendAsync(senderId.Value, request.Message);
            if (!success) return BadRequest(new { message = errorMessage });

            return Ok(new { message = "Sent." });
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }
    }
}
