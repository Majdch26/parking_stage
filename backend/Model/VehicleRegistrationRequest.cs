using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    public class VehicleRegistrationRequest
    {
        [Required(ErrorMessage = "Model is required.")]
        public int ModelId { get; set; }

        [Required(ErrorMessage = "Plate number is required.")]
        public string PlateNumber { get; set; } = string.Empty;

        public int? Year { get; set; }
        public string? Color { get; set; }
        public bool IsPrimary { get; set; }
    }
}