using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;
using System.Linq;

namespace ParkingUniversitySystem.Engine
{
    public class WaitingListEngine : IWaitingListEngine
    {
        private readonly IWaitingListRepository _waitingListRepository;
        private readonly IVehicleRepository _vehicleRepository;
        private readonly IReservationRepository _reservationRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IParkingRepository _parkingRepository;

        public WaitingListEngine(
            IWaitingListRepository waitingListRepository,
            IVehicleRepository vehicleRepository,
            IReservationRepository reservationRepository,
            INotificationRepository notificationRepository,
            IParkingRepository parkingRepository)
        {
            _waitingListRepository = waitingListRepository;
            _vehicleRepository = vehicleRepository;
            _reservationRepository = reservationRepository;
            _notificationRepository = notificationRepository;
            _parkingRepository = parkingRepository;
        }

        public async Task<(WaitingListResponse? Success, string? ErrorMessage)> JoinAsync(int userId, JoinWaitingListRequest request)
        {
            if (await _waitingListRepository.HasActiveEntryAsync(userId))
            {
                return (null, "You're already on the waiting list.");
            }

            // Small grace buffer -- without this, picking "right now" and submitting a few seconds
            // later can falsely trigger "in the past" purely from real-world delay between
            // choosing the time and the request actually reaching the server.
            var currentTimeOfDay = DateTime.Now.TimeOfDay.Subtract(TimeSpan.FromMinutes(2));
            if (request.PriorityTime < currentTimeOfDay)
            {
                return (null, "Priority time cannot be in the past. Please choose a current or upcoming time today.");
            }

            var areas = await _parkingRepository.GetAllAreasWithAvailabilityAsync();
            var totalAvailableSlots = areas.Sum(a => a.AvailableSlots);
            var currentlyWaitingCount = await _waitingListRepository.GetActiveCountAsync();

            if (totalAvailableSlots > currentlyWaitingCount)
            {
                return (null, "There are enough available slots for everyone currently waiting. Please reserve directly instead of joining the waiting list.");
            }

            var myVehicles = (await _vehicleRepository.GetByUserIdAsync(userId)).ToList();
            int vehicleId;

            if (request.VehicleId is null)
            {
                if (myVehicles.Count == 0) return (null, "You don't have any registered vehicles. Please register one first.");
                if (myVehicles.Count > 1) return (null, "You have multiple vehicles registered. Please specify which one to use.");
                vehicleId = myVehicles[0].Id;
            }
            else
            {
                if (!myVehicles.Any(v => v.Id == request.VehicleId)) return (null, "This vehicle does not belong to your account.");
                vehicleId = request.VehicleId.Value;
            }

            var entry = new WaitingListEntry
            {
                UserId = userId,
                VehicleId = vehicleId,
                PriorityTime = request.PriorityTime
            };

            var entryId = await _waitingListRepository.CreateAsync(entry);

            return (new WaitingListResponse
            {
                Id = entryId,
                PriorityTime = entry.PriorityTime,
                JoinedAt = DateTime.Now,
                Status = "waiting"
            }, null);
        }

        public async Task TryAssignFreedSlotAsync(int slotId)
        {
            var nextInLine = await _waitingListRepository.GetNextInLineAsync();
            if (nextInLine is null)
            {
                return;
            }

            // Waiting-list auto-assignment doesn't ask for an end time -- give it a sensible
            // default 1-hour window, same default used for backfilling old reservations.
            var reservation = await _reservationRepository.CreateReservationAsync(
                nextInLine.UserId, nextInLine.VehicleId, slotId, DateTime.Today,
                nextInLine.PriorityTime, nextInLine.PriorityTime.Add(TimeSpan.FromHours(1)));

            if (reservation is null)
            {
                return;
            }

            await _waitingListRepository.MarkFulfilledAsync(nextInLine.Id, slotId);

            await _notificationRepository.CreateAsync(
                nextInLine.UserId, null, "waiting_list",
                $"A slot has opened up and slot {reservation.SlotNumber} in {reservation.AreaName} has been reserved for you. You can cancel it if you no longer need it.");
        }

        public Task<IEnumerable<WaitingListResponse>> GetMyEntriesAsync(int userId) =>
            _waitingListRepository.GetByUserIdAsync(userId);

        public async Task<(bool Success, string? ErrorMessage)> CancelAsync(int userId, int entryId)
        {
            var cancelled = await _waitingListRepository.CancelAsync(entryId, userId);
            if (!cancelled) return (false, "Entry not found, doesn't belong to you, or already resolved.");
            return (true, null);
        }
        public async Task<IEnumerable<WaitingQueueItem>> GetQueueAsync(int userId)
        {
            var queue = (await _waitingListRepository.GetActiveQueueAsync()).ToList();

            return queue.Select((entry, index) => new WaitingQueueItem
            {
                Position = index + 1,
                PriorityTime = entry.PriorityTime,
                IsMe = entry.UserId == userId
            });
        }
    }
}
