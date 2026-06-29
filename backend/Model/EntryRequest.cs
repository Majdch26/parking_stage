using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    /// <summary>Body for POST /Session/entry -- represents a gate scanner reading a student's QR code.</summary>
    public class EntryRequest
    {
        [Required(ErrorMessage = "QR token is required.")]
        public string QrToken { get; set; } = string.Empty;
    }
}