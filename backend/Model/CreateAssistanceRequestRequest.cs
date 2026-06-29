using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    public class CreateAssistanceRequestRequest
    {
        [Required(ErrorMessage = "Slot is required.")]
        public int SlotId { get; set; }

        [Required(ErrorMessage = "Request type is required.")]
        public string RequestType { get; set; } = string.Empty;

        /// <summary>Free-text description, used when RequestType is "other".</summary>
        public string? Details { get; set; }
    }
}