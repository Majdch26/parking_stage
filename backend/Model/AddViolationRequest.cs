using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    public class AddViolationRequest
    {
        [Required(ErrorMessage = "Student is required.")]
        public int StudentId { get; set; }

        [Required(ErrorMessage = "Violation type is required.")]
        public int ViolationTypeId { get; set; }

        public int? SessionId { get; set; }
    }
}