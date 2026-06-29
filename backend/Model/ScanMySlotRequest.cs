using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    /// <summary>Body for POST /Session/scan-slot/mine -- the logged-in student scanning the slot
    /// sticker themselves with their own phone. No QR token needed; identity comes from the JWT.</summary>
    public class ScanMySlotRequest
    {
        [Required(ErrorMessage = "Slot token is required.")]
        public string SlotToken { get; set; } = string.Empty;
    }
}