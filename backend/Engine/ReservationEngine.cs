using System.Linq;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.Engine
{
    public class ReservationEngine : IReservationEngine
    {
        private readonly IReservationRepository _reservationRepository;
        private readonly IVehicleRepository _vehicleRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IWaitingListEngine _waitingListEngine;

        public ReservationEngine(
            IReservationRepository reservationRepository,
            IVehicleRepository vehicleRepository,
            INotificationRepository notificationRepository,
            IWaitingListEngine waitingListEngine)
        {
            _reservationRepository = reservationRepository;
            _vehicleRepository = vehicleRepository;
            _notificationRepository = notificationRepository;
            _waitingListEngine = waitingListEngine;
        }

        public async Task<(ReservationResponse? Success, string? ErrorMessage)> CreateReservationAsync(int userId, ReservationRequest request)
        {
            if (request.ScheduledEndTime <= request.ScheduledEntryTime)
            {
                return (null, "End time must be after start time.");
            }

            if (await _reservationRepository.HasAnyActiveReservationAsync(userId))
            {
                return (null, "You already have an active reservation. You can only have one active reservation at a time.");
            }

            var myVehicles = (await _vehicleRepository.GetByUserIdAsync(userId)).ToList();
            int vehicleId;

            if (request.VehicleId is null)
            {
                if (myVehicles.Count == 0)
                {
                    return (null, "You don't have any registered vehicles. Please register one first.");
                }

                if (myVehicles.Count > 1)
                {
                    return (null, "You have multiple vehicles registered. Please specify which one to use.");
                }

                vehicleId = myVehicles[0].Id;
            }
            else
            {
                var ownsVehicle = myVehicles.Any(v => v.Id == request.VehicleId);
                if (!ownsVehicle)
                {
                    return (null, "This vehicle does not belong to your account.");
                }

                vehicleId = request.VehicleId.Value;
            }

            var reservation = await _reservationRepository.CreateReservationAsync(
                userId, vehicleId, request.SlotId, request.ReservationDate, request.ScheduledEntryTime, request.ScheduledEndTime);

            if (reservation is null)
            {
                // Build a specific, useful error -- show exactly what's already booked on that slot/date.
                var existingWindows = (await _reservationRepository.GetActiveWindowsForSlotAsync(request.SlotId, request.ReservationDate)).ToList();
                if (existingWindows.Count > 0)
                {
                    var windowsText = string.Join(", ", existingWindows.Select(w => $"{w.StartTime:hh\\:mm}-{w.EndTime:hh\\:mm}"));
                    return (null, $"This slot is already reserved during: {windowsText}. Please pick a different time.");
                }

                return (null, "This slot isn't available (it may be in maintenance). Please pick another.");
            }

            await _notificationRepository.CreateAsync(
                userId, null, "reservation",
                $"Your reservation for slot {reservation.SlotNumber} in {reservation.AreaName} on {reservation.ReservationDate:yyyy-MM-dd} from {reservation.ScheduledEntryTime} to {reservation.ScheduledEndTime} is confirmed.");

            return (reservation, null);
        }

        public async Task<(bool Success, string? ErrorMessage)> CancelReservationAsync(int userId, int reservationId)
        {
            var (cancelled, freedSlotId) = await _reservationRepository.CancelReservationAsync(reservationId, userId);

            if (!cancelled)
            {
                return (false, "Reservation not found, doesn't belong to you, or is no longer active.");
            }

            await _notificationRepository.CreateAsync(
                userId, null, "reservation", "Your reservation has been cancelled and the slot has been released.");

            if (freedSlotId is not null)
            {
                await _waitingListEngine.TryAssignFreedSlotAsync(freedSlotId.Value);
            }

            return (true, null);
        }

        public Task<IEnumerable<ReservationResponse>> GetMyReservationsAsync(int userId) =>
            _reservationRepository.GetByUserIdAsync(userId);

        public async Task<(bool Success, string? ErrorMessage)> UpdateReservationTimeAsync(int userId, int reservationId, ReservationUpdateRequest request)
        {
            if (request.ScheduledEndTime <= request.ScheduledEntryTime)
            {
                return (false, "End time must be after start time.");
            }

            var updated = await _reservationRepository.UpdateReservationTimeAsync(
                reservationId, userId, request.ReservationDate, request.ScheduledEntryTime, request.ScheduledEndTime);

            if (!updated)
            {
                return (false, "Reservation not found, doesn't belong to you, no longer active, or overlaps another reservation on that slot.");
            }

            await _notificationRepository.CreateAsync(
                userId, null, "reservation",
                $"Your reservation time has been updated to {request.ReservationDate:yyyy-MM-dd} from {request.ScheduledEntryTime} to {request.ScheduledEndTime}.");

            return (true, null);
        }

        public Task<IEnumerable<ReservationWindowResponse>> GetSlotWindowsAsync(int slotId, DateTime date) =>
            _reservationRepository.GetActiveWindowsForSlotAsync(slotId, date);
    }
}