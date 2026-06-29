using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    public class CreateViolationTypeRequest
    {
        [Required(ErrorMessage = "Code is required.")]
        public string Code { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required(ErrorMessage = "Points is required.")]
        [Range(1, 100, ErrorMessage = "Points must be between 1 and 100.")]
        public int Points { get; set; }
    }
}