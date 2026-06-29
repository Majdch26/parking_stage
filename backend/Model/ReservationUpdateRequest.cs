using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    /// <summary>Body for PATCH /Reservation/{id} -- changes when the student plans to use their already-claimed slot.</summary>
    public class ReservationUpdateRequest
    {
        [Required(ErrorMessage = "Reservation date is required.")]
        public DateTime ReservationDate { get; set; }

        [Required(ErrorMessage = "Scheduled entry time is required.")]
        public TimeSpan ScheduledEntryTime { get; set; }

        [Required(ErrorMessage = "Scheduled end time is required.")]
        public TimeSpan ScheduledEndTime { get; set; }
    }
}