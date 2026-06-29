using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Model;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ParkingUniversitySystem.Controllers
{
    /// <summary>
    /// Gate entry endpoint. AllowAnonymous because this represents a physical gate
    /// scanner reading a QR code, not the student's own authenticated session --
    /// identity comes entirely from the qrToken itself, not a JWT.
    /// </summary>
    [ApiController]
    [Route("[controller]")]
    public class SessionController : ControllerBase
    {
        private readonly IParkingSessionEngine _sessionEngine;

        public SessionController(IParkingSessionEngine sessionEngine)
        {
            _sessionEngine = sessionEngine;
        }

        /// <summary>POST /Session/entry -- a gate scanner reading a student's QR code.</summary>
        [HttpPost("entry")]
        [AllowAnonymous]
        public async Task<IActionResult> Enter([FromBody] EntryRequest request)
        {
            var (response, errorMessage) = await _sessionEngine.EnterAsync(request.QrToken);

            if (response is null)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(response);
        }
        /// <summary>POST /Session/scan-slot -- a student scanning the physical sticker on the spot they parked in.</summary>
        [HttpPost("scan-slot")]
        [AllowAnonymous]
        public async Task<IActionResult> ScanSlot([FromBody] SlotScanRequest request)
        {
            var (response, errorMessage) = await _sessionEngine.ScanSlotAsync(request);

            if (response is null)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(response);
        }
        /// <summary>GET /Session/mine -- the logged-in student's own current/most recent session.</summary>
        [HttpGet("mine")]
        [Authorize]
        public async Task<IActionResult> GetMine()
        {
            var userId = GetUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var session = await _sessionEngine.GetMySessionAsync(userId.Value);
            if (session is null)
            {
                return NotFound(new { message = "No session found." });
            }

            return Ok(session);
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }
        /// <summary>POST /Session/exit -- a gate scanner reading a student's QR code on the way out.</summary>
        [HttpPost("exit")]
        [AllowAnonymous]
        public async Task<IActionResult> Exit([FromBody] EntryRequest request)
        {
            var (response, errorMessage) = await _sessionEngine.ExitAsync(request.QrToken);

            if (response is null)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(response);
        }
        /// <summary>POST /Session/scan-slot/mine -- the logged-in student scans the slot sticker with their own phone.
        /// Identity comes from the JWT, not a second QR scan.</summary>
        [HttpPost("scan-slot/mine")]
        [Authorize]
        public async Task<IActionResult> ScanMySlot([FromBody] ScanMySlotRequest request)
        {
            var userId = GetUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var (response, errorMessage) = await _sessionEngine.ScanMySlotAsync(userId.Value, request.SlotToken);

            if (response is null)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(response);
        }
        /// <summary>GET /Session/active/{userId} -- worker/admin lookup of a student's currently open session
        /// (entered or parked), so a manually-added violation can be linked to it.</summary>
        [HttpGet("active/{userId}")]
        [Authorize(Roles = "worker,admin")]
        public async Task<IActionResult> GetActiveSession(int userId)
        {
            var sessionId = await _sessionEngine.GetActiveSessionIdAsync(userId);
            return Ok(new { sessionId });
        }
        /// <summary>GET /Session/history -- every past session for the logged-in student, grouped by date on the frontend.</summary>
        [HttpGet("history")]
        [Authorize]
        public async Task<IActionResult> GetHistory()
        {
            var userId = GetUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var history = await _sessionEngine.GetHistoryAsync(userId.Value);
            return Ok(history);
        }

        /// <summary>POST /Session/history/clear -- hides everything before now from the student's own history view.</summary>
        [HttpPost("history/clear")]
        [Authorize]
        public async Task<IActionResult> ClearHistory()
        {
            var userId = GetUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            await _sessionEngine.ClearHistoryAsync(userId.Value);
            return Ok(new { message = "Historique effacé." });
        }
        /// <summary>GET /Session/history/{userId} -- admin only. Any student's full session history.</summary>
        [HttpGet("history/{userId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetHistoryForUser(int userId)
        {
            var history = await _sessionEngine.GetHistoryAsync(userId);
            return Ok(history);
        }
    }
}