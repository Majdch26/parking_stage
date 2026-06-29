using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Controllers
{
    /// <summary>Reservation endpoints. Student-only -- same reasoning as VehicleController, only students own vehicles to reserve for.</summary>
    [ApiController]
    [Route("[controller]")]
    [Authorize(Roles = UserRoles.Student)]
    public class ReservationController : ControllerBase
    {
        private readonly IReservationEngine _reservationEngine;

        public ReservationController(IReservationEngine reservationEngine)
        {
            _reservationEngine = reservationEngine;
        }

        /// <summary>POST /Reservation -- reserves an available slot in the chosen area for the logged-in student.</summary>
        [HttpPost]
        public async Task<IActionResult> CreateReservation([FromBody] ReservationRequest request)
        {
            var userId = GetUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var (response, errorMessage) = await _reservationEngine.CreateReservationAsync(userId.Value, request);

            if (response is null)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(response);
        }

        /// <summary>GET /Reservation/slot/{slotId}/windows?date=2026-07-01 -- existing reservation
        /// windows on this slot for that date, so the student can see what's already booked.</summary>
        [HttpGet("slot/{slotId}/windows")]
        public async Task<IActionResult> GetSlotWindows(int slotId, [FromQuery] DateTime date)
        {
            var windows = await _reservationEngine.GetSlotWindowsAsync(slotId, date);
            return Ok(windows);
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }
        /// <summary>POST /Reservation/{id}/cancel -- cancels your own reservation and frees its slot.</summary>
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelReservation(int id)
        {
            var userId = GetUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var (success, errorMessage) = await _reservationEngine.CancelReservationAsync(userId.Value, id);

            if (!success)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(new { message = "Reservation cancelled." });
        }
        /// <summary>GET /Reservation/mine -- every reservation belonging to the logged-in student, most recent first.</summary>
        [HttpGet("mine")]
        public async Task<IActionResult> GetMyReservations()
        {
            var userId = GetUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var reservations = await _reservationEngine.GetMyReservationsAsync(userId.Value);
            return Ok(reservations);
        }

        /// <summary>PATCH /Reservation/{id} -- changes the date/time of an existing active reservation (same slot, not the slot itself).</summary>
        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateReservationTime(int id, [FromBody] ReservationUpdateRequest request)
        {
            var userId = GetUserId();
            if (userId is null)
            {
                return Unauthorized();
            }

            var (success, errorMessage) = await _reservationEngine.UpdateReservationTimeAsync(userId.Value, id, request);

            if (!success)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(new { message = "Reservation updated." });
        }
    }
}