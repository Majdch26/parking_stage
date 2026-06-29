using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    public class UpdateViolationTypeRequest
    {
        public string? Description { get; set; }

        [Required(ErrorMessage = "Points is required.")]
        [Range(1, 100)]
        public int Points { get; set; }
    }
}
