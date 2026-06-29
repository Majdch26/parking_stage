using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize(Roles = "admin")]
    public class ViolationTypeController : ControllerBase
    {
        private readonly IViolationTypeEngine _violationTypeEngine;

        public ViolationTypeController(IViolationTypeEngine violationTypeEngine)
        {
            _violationTypeEngine = violationTypeEngine;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var types = await _violationTypeEngine.GetAllAsync();
            return Ok(types);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateViolationTypeRequest request)
        {
            var (success, errorMessage) = await _violationTypeEngine.CreateAsync(request);
            if (!success) return BadRequest(new { message = errorMessage });
            return Ok(new { message = "Violation type created." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateViolationTypeRequest request)
        {
            var (success, errorMessage) = await _violationTypeEngine.UpdateAsync(id, request);
            if (!success) return BadRequest(new { message = errorMessage });
            return Ok(new { message = "Violation type updated." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var (success, errorMessage) = await _violationTypeEngine.DeleteAsync(id);
            if (!success) return BadRequest(new { message = errorMessage });
            return Ok(new { message = "Violation type deleted." });
        }
    }
}