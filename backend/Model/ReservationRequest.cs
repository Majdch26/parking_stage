using System.ComponentModel.DataAnnotations;

namespace ParkingUniversitySystem.Model
{
    /// <summary>
    /// Body for POST /Reservation. UserId comes from the JWT, not here.
    /// The student picks an area and a vehicle; ReservationEngine assigns
    /// an actual available slot within that area.
    /// </summary>
    public class ReservationRequest
    {
        /// <summary>Optional -- if omitted and the student has exactly one registered vehicle, that one is used automatically.</summary>
        public int? VehicleId { get; set; }

        [Required(ErrorMessage = "Slot is required.")]
        public int SlotId { get; set; }

        [Required(ErrorMessage = "Reservation date is required.")]
        public DateTime ReservationDate { get; set; }

        [Required(ErrorMessage = "Scheduled entry time is required.")]
        public TimeSpan ScheduledEntryTime { get; set; }

        [Required(ErrorMessage = "Scheduled end time is required.")]
        public TimeSpan ScheduledEndTime { get; set; }
    }
}