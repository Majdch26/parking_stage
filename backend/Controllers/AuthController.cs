using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Model;
using System.Security.Claims;
namespace ParkingUniversitySystem.Controllers
{
    /// <summary>
    /// Public authentication endpoints. Neither action requires a token --
    /// signup creates the account, login returns a token to use on protected endpoints later.
    /// </summary>
    [ApiController]
    [Route("[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthEngine _authEngine;

        public AuthController(IAuthEngine authEngine)
        {
            _authEngine = authEngine;
        }

        /// <summary>POST /Auth/signup -- creates a student or worker account after validating against the university list.</summary>
        [HttpPost("signup")]
        [AllowAnonymous]
        public async Task<IActionResult> Signup([FromBody] SignupRequest request)
        {
            var (response, errorMessage) = await _authEngine.SignupAsync(request);

            if (response is null)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(response);
        }

        /// <summary>POST /Auth/login -- validates credentials and returns a JWT bearer token.</summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var response = await _authEngine.LoginAsync(request);

            if (response is null)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            return Ok(response);
        }

        /// <summary>POST /Auth/forgot-password -- resets a password by proving identity with
        /// email + university ID together (no email is sent; there's no mail service here).</summary>
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var (success, errorMessage) = await _authEngine.ResetForgottenPasswordAsync(request);
            if (!success) return BadRequest(new { message = errorMessage });
            return Ok(new { message = "Password reset successfully." });
        }
        /// <summary>GET /Auth/me -- the logged-in user's own profile.</summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var userId = GetUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var me = await _authEngine.GetMeAsync(userId.Value);
            if (me is null)
            {
                return NotFound();
            }

            return Ok(me);
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }
    }
}