using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    /// <summary>Body for POST /Worker/check-in -- worker picks which zone they're covering this shift.</summary>
    public class CheckInRequest
    {
        [Required(ErrorMessage = "Area is required.")]
        public int AreaId { get; set; }
    }
}