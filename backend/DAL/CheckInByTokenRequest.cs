using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    /// <summary>Body for POST /WorkerShift/check-in/scan -- the logged-in worker scans the zone's
    /// printed QR sticker to prove they're physically there, instead of picking from a dropdown.</summary>
    public class CheckInByTokenRequest
    {
        [Required(ErrorMessage = "Area token is required.")]
        public string AreaToken { get; set; } = string.Empty;
    }
}