using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    public class AddMultipleViolationsRequest
    {
        [Required(ErrorMessage = "Student is required.")]
        public int StudentId { get; set; }

        [Required(ErrorMessage = "At least one violation type is required.")]
        [MinLength(1, ErrorMessage = "At least one violation type is required.")]
        public List<int> ViolationTypeIds { get; set; } = new();

        public int? SessionId { get; set; }
    }
}