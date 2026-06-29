using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface IReservationRepository
    {
        /// <summary>
        /// Creates a reservation for [scheduledEntryTime, scheduledEndTime) on this slot/date, as
        /// long as it doesn't overlap any other active reservation already on that slot for that
        /// date, and the slot isn't in maintenance. A slot can carry multiple non-overlapping
        /// reservations across a day -- it's only ever exclusive within the requested time window,
        /// not for the whole day. Returns null if the slot doesn't exist, is in maintenance, or
        /// the requested window overlaps an existing one.
        /// </summary>
        Task<ReservationResponse?> CreateReservationAsync(
            int userId, int vehicleId, int slotId, DateTime reservationDate,
            TimeSpan scheduledEntryTime, TimeSpan scheduledEndTime);

        /// <summary>True if this user already has any pending or confirmed reservation -- only one active reservation allowed at a time.</summary>
        Task<bool> HasAnyActiveReservationAsync(int userId);

        /// <summary>
        /// Cancels the reservation if it belongs to this user and is still active. Returns whether
        /// the cancel itself succeeded, and separately the freed slot id -- the slot id is only
        /// populated if no OTHER active reservation remains on that slot, since other time windows
        /// on the same slot mean it isn't actually free yet.
        /// </summary>
        Task<(bool Cancelled, int? FreedSlotId)> CancelReservationAsync(int reservationId, int userId);

        Task<IEnumerable<ReservationResponse>> GetByUserIdAsync(int userId);

        /// <summary>Updates the scheduled date/time window if it belongs to this user, is still
        /// active, and doesn't overlap another active reservation on the same slot/date.</summary>
        Task<bool> UpdateReservationTimeAsync(int reservationId, int userId, DateTime reservationDate, TimeSpan scheduledEntryTime, TimeSpan scheduledEndTime);

        /// <summary>Looks up which area a slot belongs to -- needed to know who's waiting for it.</summary>
        Task<int> GetAreaIdBySlotIdAsync(int slotId);

        /// <summary>Confirmed reservations whose scheduled end time + 30-minute grace period has passed with no entry ever recorded.</summary>
        Task<IEnumerable<Reservation>> GetExpiredReservationsAsync();

        /// <summary>Marks expired. Whether it expired and whether the slot is now actually free
        /// follow the same two-part reasoning as CancelReservationAsync above.</summary>
        Task<(bool Expired, int? FreedSlotId)> ExpireAsync(int reservationId);

        /// <summary>Confirmed/used reservations whose end time has passed and haven't been notified yet.</summary>
        Task<IEnumerable<Reservation>> GetEndedReservationsNeedingNotificationAsync();

        /// <summary>Marks a reservation's end as notified and frees its slot if nothing else holds it. Returns the freed slot id, or null if already handled / still held.</summary>
        Task<int?> CompleteEndedReservationAsync(int reservationId);

        /// <summary>Every active reservation window on this slot for this date -- shown to a
        /// student picking that slot, so they can see what's already booked and pick a free time.</summary>
        Task<IEnumerable<ReservationWindowResponse>> GetActiveWindowsForSlotAsync(int slotId, DateTime date);
    }
}