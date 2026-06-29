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
        private readonly ILogger<WorkerChatController> _logger;

        public WorkerChatController(IWorkerChatEngine chatEngine, ILogger<WorkerChatController> logger)
        {
            _chatEngine = chatEngine;
            _logger = logger;
        }

        [HttpGet("messages")]
        public async Task<IActionResult> GetMessages()
        {
            try
            {
                var messages = await _chatEngine.GetRecentAsync();
                return Ok(messages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur dans GetMessages");
                return StatusCode(500, new { message = "Erreur interne : " + ex.Message });
            }
        }

        [HttpGet("messages/since/{afterId:int}")]
        public async Task<IActionResult> GetSince(int afterId)
        {
            try
            {
                var messages = await _chatEngine.GetSinceAsync(afterId);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur dans GetSince");
                return StatusCode(500, new { message = "Erreur interne : " + ex.Message });
            }
        }

        [HttpPost("messages")]
        public async Task<IActionResult> SendMessage([FromBody] SendWorkerChatMessageRequest request)
        {
            try
            {
                var senderId = GetUserId();
                if (senderId is null) return Unauthorized();

                var (success, errorMessage) = await _chatEngine.SendAsync(senderId.Value, request.Message);
                if (!success) return BadRequest(new { message = errorMessage });

                return Ok(new { message = "Sent." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur dans SendMessage");
                return StatusCode(500, new { message = "Erreur interne : " + ex.Message });
            }
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }
    }
}