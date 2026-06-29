using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize(Roles = "worker,admin")]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserEngine _userEngine;
        private readonly IAuthEngine _authEngine;

        public UserController(IUserRepository userRepository, IUserEngine userEngine, IAuthEngine authEngine)
        {
            _userRepository = userRepository;
            _userEngine = userEngine;
            _authEngine = authEngine;
        }

        /// <summary>GET /User/search?storedId=S1001 -- finds a student by their university id.</summary>
        [HttpGet("search")]
        public async Task<IActionResult> SearchByStoredId([FromQuery] string storedId)
        {
            var user = await _userRepository.GetByStoredIdAsync(storedId);
            if (user is null || user.Role != "student")
            {
                return NotFound(new { message = "Student not found." });
            }

            return Ok(new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                points = user.Points
            });
        }

        /// <summary>GET /User -- admin only. Every user in the system.</summary>
        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userEngine.GetAllUsersAsync();
            return Ok(users);
        }

        /// <summary>POST /User/{id}/unban -- admin only. Resets points to 0 and lifts the ban.</summary>
        [HttpPost("{id}/unban")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Unban(int id)
        {
            var (success, errorMessage) = await _userEngine.UnbanAsync(id);
            if (!success) return BadRequest(new { message = errorMessage });
            return Ok(new { message = "User unbanned." });
        }
        /// <summary>PUT /User/{id} -- admin only. Edits a user's name/email.</summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            var (success, errorMessage) = await _userEngine.UpdateUserAsync(id, request);
            if (!success) return BadRequest(new { message = errorMessage });
            return Ok(new { message = "User updated." });
        }
        /// <summary>POST /User/{id}/ban -- admin only. Manually blocks an account.</summary>
        [HttpPost("{id}/ban")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Ban(int id)
        {
            var (success, errorMessage) = await _userEngine.BanAsync(id);
            if (!success) return BadRequest(new { message = errorMessage });
            return Ok(new { message = "User banned." });
        }

        /// <summary>POST /User/{id}/reset-password -- admin only. Sets a new password directly.</summary>
        [HttpPost("{id}/reset-password")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ResetPassword(int id, [FromBody] AdminResetPasswordRequest request)
        {
            var (success, errorMessage) = await _userEngine.ResetPasswordAsync(id, request.NewPassword);
            if (!success) return BadRequest(new { message = errorMessage });
            return Ok(new { message = "Password reset." });
        }

        /// <summary>POST /User/create-worker -- admin only. Creates a worker account directly,
        /// reusing the same university-id validation as the public worker signup form.</summary>
        [HttpPost("create-worker")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CreateWorker([FromBody] AdminCreateWorkerRequest request)
        {
            var signupRequest = new SignupRequest
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Password = request.Password,
                StoredId = request.StoredId,
                Role = "worker"
            };

            var (result, errorMessage) = await _authEngine.SignupAsync(signupRequest);
            if (result is null) return BadRequest(new { message = errorMessage });

            return Ok(new { message = "Worker created.", id = result.Id });
        }
    }
}