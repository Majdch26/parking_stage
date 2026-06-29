using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    /// <summary>Body for POST /WaitingList -- student requests a slot for a specific time when the lot is full.</summary>
    public class JoinWaitingListRequest
    {
        public int? VehicleId { get; set; }
     

        [Required(ErrorMessage = "Priority time is required.")]
        public TimeSpan PriorityTime { get; set; }
    }
}