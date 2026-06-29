using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingUniversitySystem.Engine;

namespace ParkingUniversitySystem.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationEngine _notificationEngine;

        public NotificationController(INotificationEngine notificationEngine)
        {
            _notificationEngine = notificationEngine;
        }

        /// <summary>GET /Notification/mine -- the logged-in user's own notifications, most recent first.</summary>
        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var notifications = await _notificationEngine.GetMyNotificationsAsync(userId.Value);
            return Ok(notifications);
        }

        /// <summary>PATCH /Notification/{id}/read -- marks one of your own notifications as read.</summary>
        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var success = await _notificationEngine.MarkAsReadAsync(id, userId.Value);
            if (!success) return BadRequest(new { message = "Notification not found or doesn't belong to you." });

            return Ok(new { message = "Marked as read." });
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }
        /// <summary>PATCH /Notification/read-all -- marks every unread notification as read in one call.</summary>
        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            await _notificationEngine.MarkAllAsReadAsync(userId.Value);
            return Ok(new { message = "All marked as read." });
        }
    }
}
