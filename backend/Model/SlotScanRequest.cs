using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    /// <summary>Body for POST /Session/scan-slot -- a student scanning the physical sticker on the spot they parked in.</summary>
    public class SlotScanRequest
    {
        [Required(ErrorMessage = "QR token is required.")]
        public string QrToken { get; set; } = string.Empty;

        [Required(ErrorMessage = "Slot token is required.")]
        public string SlotToken { get; set; } = string.Empty;
    }
}