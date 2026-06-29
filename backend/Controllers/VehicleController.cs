using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Controllers
{
    /// <summary>
    /// Vehicle registration endpoints. Student-only -- workers and admin never register cars.
    /// </summary>
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class VehicleController : ControllerBase
    {
        private readonly IVehicleEngine _vehicleEngine;

        public VehicleController(IVehicleEngine vehicleEngine)
        {
            _vehicleEngine = vehicleEngine;
        }

        [HttpGet("brands")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBrands()
        {
            var brands = await _vehicleEngine.GetBrandsAsync();
            return Ok(brands);
        }

        [HttpGet("brands/{brandId}/models")]
        [AllowAnonymous]
        public async Task<IActionResult> GetModelsByBrand(int brandId)
        {
            var models = await _vehicleEngine.GetModelsByBrandAsync(brandId);
            return Ok(models);
        }

        [HttpPost]
        [Authorize(Roles = UserRoles.Student)]
        public async Task<IActionResult> RegisterVehicle([FromBody] VehicleRegistrationRequest request)
        {
            var userId = GetUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var (response, errorMessage) = await _vehicleEngine.RegisterVehicleAsync(userId.Value, request);

            if (response is null)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(response);
        }

        [HttpGet("mine")]
        [Authorize(Roles = UserRoles.Student)]
        public async Task<IActionResult> GetMyVehicles()
        {
            var userId = GetUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var vehicles = await _vehicleEngine.GetMyVehiclesAsync(userId.Value);
            return Ok(vehicles);
        }

        /// <summary>GET /Vehicle/user/{userId} -- admin only. Lets the admin see any student's cars
        /// from the user management page, without needing their own vehicle session.</summary>
        [HttpGet("user/{userId}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> GetVehiclesForUser(int userId)
        {
            var vehicles = await _vehicleEngine.GetMyVehiclesAsync(userId);
            return Ok(vehicles);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = UserRoles.Student)]
        public async Task<IActionResult> RemoveVehicle(int id)
        {
            var userId = GetUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var (success, errorMessage) = await _vehicleEngine.RemoveVehicleAsync(userId.Value, id);

            if (!success)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(new { message = "Vehicle removed." });
        }

        [HttpPatch("{id}/set-primary")]
        [Authorize(Roles = UserRoles.Student)]
        public async Task<IActionResult> SetPrimaryVehicle(int id)
        {
            var userId = GetUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var (success, errorMessage) = await _vehicleEngine.SetPrimaryVehicleAsync(userId.Value, id);

            if (!success)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(new { message = "Primary vehicle updated." });
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }
    }
}