using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;
using System.Linq;

namespace ParkingUniversitySystem.Engine
{
    public class ParkingSessionEngine : IParkingSessionEngine
    {
        private readonly IParkingSessionRepository _sessionRepository;
        private readonly IUserRepository _userRepository;
        private readonly IVehicleRepository _vehicleRepository;
        private readonly ISlotScanRepository _slotScanRepository;
        private readonly IWaitingListEngine _waitingListEngine;

        public ParkingSessionEngine(
            IParkingSessionRepository sessionRepository,
            IUserRepository userRepository,
            IVehicleRepository vehicleRepository,
            ISlotScanRepository slotScanRepository,
            IWaitingListEngine waitingListEngine)
        {
            _sessionRepository = sessionRepository;
            _userRepository = userRepository;
            _vehicleRepository = vehicleRepository;
            _slotScanRepository = slotScanRepository;
            _waitingListEngine = waitingListEngine;
        }

        public async Task<(EntryResponse? Success, string? ErrorMessage)> EnterAsync(string qrToken)
        {
            var user = await _userRepository.GetByQrTokenAsync(qrToken);
            if (user is null)
            {
                return (null, "Invalid QR code.");
            }

            if (user.Status == "blocked")
            {
                return (null, "This account is banned and cannot enter.");
            }

            if (user.Role != UserRoles.Student)
            {
                return (null, "This entry gate is for student vehicles only.");
            }

            var existingOpenSession = await _sessionRepository.GetOpenSessionByUserIdAsync(user.Id);
            if (existingOpenSession is not null)
            {
                return (null, "You already have an active session. Please scan the exit gate before entering again.");
            }

            var reservation = await _sessionRepository.GetActiveReservationForEntryAsync(user.Id);
            int vehicleId;
            int? slotId = null;

            if (reservation is not null)
            {
                vehicleId = reservation.VehicleId;
                slotId = reservation.SlotId;
            }
            else
            {
                var myVehicles = await _vehicleRepository.GetByUserIdAsync(user.Id);
                var primaryVehicle = myVehicles.FirstOrDefault(v => v.IsPrimary);

                if (primaryVehicle is null)
                {
                    return (null, "No registered vehicle found for this account.");
                }

                vehicleId = primaryVehicle.Id;
            }

            var entryTime = DateTime.Now;
            entryTime = entryTime.AddTicks(-(entryTime.Ticks % TimeSpan.TicksPerSecond));

            var session = new ParkingSession
            {
                UserId = user.Id,
                VehicleId = vehicleId,
                ReservationId = reservation?.Id,
                SlotId = slotId,
                EntryTime = entryTime,
                Status = "entered",
                SlotScanDeadline = entryTime.AddMinutes(40)
            };

            var sessionId = await _sessionRepository.CreateSessionAsync(session);

            return (new EntryResponse
            {
                SessionId = sessionId,
                EntryTime = entryTime,
                SlotScanDeadline = session.SlotScanDeadline.Value,
                HasReservation = reservation is not null,
                ReservedSlotId = slotId
            }, null);
        }

        public async Task<(SlotScanResponse? Success, string? ErrorMessage)> ScanSlotAsync(SlotScanRequest request)
        {
            var user = await _userRepository.GetByQrTokenAsync(request.QrToken);
            if (user is null)
            {
                return (null, "Invalid QR code.");
            }

            var session = await _sessionRepository.GetActiveSessionByUserIdAsync(user.Id);
            if (session is null)
            {
                return (null, "No active entry found. Please scan in at the gate first.");
            }

            var scannedSlot = await _slotScanRepository.GetSlotByTokenAsync(request.SlotToken);
            if (scannedSlot is null)
            {
                return (null, "Invalid slot code.");
            }

            // The reservation frozen at entry time (session.SlotId) might be null if the student
            // reserved AFTER already entering the gate. Always re-check their *current* confirmed
            // reservation too, so a late reservation is still enforced.
            var liveReservation = await _sessionRepository.GetActiveReservationForEntryAsync(user.Id);
            var expectedSlotId = session.SlotId ?? liveReservation?.SlotId;

            if (expectedSlotId is not null && expectedSlotId != scannedSlot.Id)
            {
                var correctSlotNumber = await _slotScanRepository.GetSlotNumberByIdAsync(expectedSlotId.Value);
                await _slotScanRepository.RecordFailedScanAsync(session.Id, scannedSlot.Id, "wrong_slot");
                return (null, $"This is not your reserved slot. Your slot is {correctSlotNumber}. Remove your car or you will get a violation point.");
            }

            if (expectedSlotId is null && scannedSlot.Status == "reserved")
            {
                await _slotScanRepository.RecordFailedScanAsync(session.Id, scannedSlot.Id, "reserved_blocked");
                return (null, "Reserved slot! Please choose a different available slot.");
            }

            var scanTime = DateTime.Now;
            scanTime = scanTime.AddTicks(-(scanTime.Ticks % TimeSpan.TicksPerSecond));

            var status = (session.SlotScanDeadline is not null && scanTime > session.SlotScanDeadline.Value)
                ? "late_scan"
                : "valid";

            await _slotScanRepository.RecordSuccessfulScanAsync(session.Id, scannedSlot.Id, status);

            return (new SlotScanResponse
            {
                Status = status,
                SlotNumber = scannedSlot.SlotNumber,
                ScanTime = scanTime
            }, null);
        }

        public async Task<(ExitResponse? Success, string? ErrorMessage)> ExitAsync(string qrToken)
        {
            var user = await _userRepository.GetByQrTokenAsync(qrToken);
            if (user is null)
            {
                return (null, "Invalid QR code.");
            }

            var session = await _sessionRepository.GetOpenSessionByUserIdAsync(user.Id);
            if (session is null)
            {
                return (null, "No active session found. You haven't entered yet.");
            }

            var (exitTime, slotId, areaId) = await _sessionRepository.ExitAsync(session.Id);

            if (slotId is not null)
            {
                await _waitingListEngine.TryAssignFreedSlotAsync(slotId.Value);
            }

            return (new ExitResponse
            {
                SessionId = session.Id,
                ExitTime = exitTime
            }, null);
        }

        public Task<SessionStatusResponse?> GetMySessionAsync(int userId) =>
            _sessionRepository.GetMostRecentSessionStatusByUserIdAsync(userId);

        public async Task<(SlotScanResponse? Success, string? ErrorMessage)> ScanMySlotAsync(int userId, string slotToken)
        {
            var session = await _sessionRepository.GetActiveSessionByUserIdAsync(userId);
            if (session is null)
            {
                return (null, "No active entry found. Please scan in at the gate first.");
            }

            var scannedSlot = await _slotScanRepository.GetSlotByTokenAsync(slotToken);
            if (scannedSlot is null)
            {
                return (null, "Invalid slot code.");
            }

            // Same live-reservation fallback as ScanSlotAsync: don't rely only on session.SlotId,
            // which can be null if the reservation was made after gate entry.
            var liveReservation = await _sessionRepository.GetActiveReservationForEntryAsync(userId);
            var expectedSlotId = session.SlotId ?? liveReservation?.SlotId;

            if (expectedSlotId is not null && expectedSlotId != scannedSlot.Id)
            {
                var correctSlotNumber = await _slotScanRepository.GetSlotNumberByIdAsync(expectedSlotId.Value);
                await _slotScanRepository.RecordFailedScanAsync(session.Id, scannedSlot.Id, "wrong_slot");
                return (null, $"This is not your reserved slot. Your slot is {correctSlotNumber}. Remove your car or you will get a violation point.");
            }

            if (expectedSlotId is null && scannedSlot.Status == "reserved")
            {
                await _slotScanRepository.RecordFailedScanAsync(session.Id, scannedSlot.Id, "reserved_blocked");
                return (null, "Reserved slot! Please choose a different available slot.");
            }

            var scanTime = DateTime.Now;
            scanTime = scanTime.AddTicks(-(scanTime.Ticks % TimeSpan.TicksPerSecond));

            var status = (session.SlotScanDeadline is not null && scanTime > session.SlotScanDeadline.Value)
                ? "late_scan"
                : "valid";

            await _slotScanRepository.RecordSuccessfulScanAsync(session.Id, scannedSlot.Id, status);

            return (new SlotScanResponse
            {
                Status = status,
                SlotNumber = scannedSlot.SlotNumber,
                ScanTime = scanTime
            }, null);
        }

        public async Task<int?> GetActiveSessionIdAsync(int userId)
        {
            var session = await _sessionRepository.GetOpenSessionByUserIdAsync(userId);
            return session?.Id;
        }

        public Task<IEnumerable<SessionHistoryItem>> GetHistoryAsync(int userId) =>
            _sessionRepository.GetHistoryByUserIdAsync(userId);

        public Task ClearHistoryAsync(int userId) =>
            _sessionRepository.ClearHistoryAsync(userId);
    }
}