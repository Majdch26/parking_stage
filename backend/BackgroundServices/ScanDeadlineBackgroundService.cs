using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ParkingUniversitySystem.Engine;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.BackgroundServices
{
    /// <summary>
    /// Runs continuously: sends a 15-minute scan reminder, issues a no_scan violation
    /// after the full 40-minute deadline, issues a wrong_slot violation if not corrected
    /// within 15 minutes, expires no-show reservations, and auto-cancels waiting-list
    /// entries whose requested time has passed unfulfilled.
    /// </summary>
    public class ScanDeadlineBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;

        public ScanDeadlineBackgroundService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var sessionRepository = scope.ServiceProvider.GetRequiredService<IParkingSessionRepository>();
                    var notificationRepository = scope.ServiceProvider.GetRequiredService<INotificationRepository>();
                    var violationRepository = scope.ServiceProvider.GetRequiredService<IViolationRepository>();
                    var violationTypeRepository = scope.ServiceProvider.GetRequiredService<IViolationTypeRepository>();
                    var slotScanRepository = scope.ServiceProvider.GetRequiredService<ISlotScanRepository>();
                    var reservationRepository = scope.ServiceProvider.GetRequiredService<IReservationRepository>();
                    var waitingListEngine = scope.ServiceProvider.GetRequiredService<IWaitingListEngine>();
                    var waitingListRepository = scope.ServiceProvider.GetRequiredService<IWaitingListRepository>();

                    // ---- Job 5: auto-cancel waiting-list entries whose requested time has passed unfulfilled ----
                    var pastDueEntries = await waitingListRepository.GetPastDueEntriesAsync();
                    foreach (var entry in pastDueEntries)
                    {
                        await waitingListRepository.ExpireAsync(entry.Id);

                        await notificationRepository.CreateAsync(
                            entry.UserId, null, "waiting_list",
                            "The time you requested for the waiting list has passed and no slot was available. Your request has been cancelled. Do you want to update the time?");
                    }

                    // ---- Job 4: expire confirmed reservations nobody showed up for ----
                    var expiredReservations = await reservationRepository.GetExpiredReservationsAsync();
                    foreach (var reservation in expiredReservations)
                    {
                        var (expired, freedSlotId) = await reservationRepository.ExpireAsync(reservation.Id);
                        if (expired)
                        {
                            await notificationRepository.CreateAsync(
                                reservation.UserId, null, "reservation",
                                "Your reservation was cancelled because you didn't arrive within the grace period (1/4 of your reserved duration). The slot is now available.");

                            // Only actually free for the waiting list once NO other time window
                            // remains on that slot -- same reasoning as cancelling a reservation.
                            if (freedSlotId is not null)
                            {
                                await waitingListEngine.TryAssignFreedSlotAsync(freedSlotId.Value);
                            }
                        }
                    }

                    // ---- Job 1: 15-minute scan reminder ----
                    var sessionsNeedingReminder = await sessionRepository.GetSessionsNeedingScanReminderAsync();
                    foreach (var session in sessionsNeedingReminder)
                    {
                        await notificationRepository.CreateAsync(
                            session.UserId,
                            null,
                            "scan_reminder",
                            "You haven't scanned your parking slot yet. Please scan within 25 minutes or you will receive a violation.");
                    }

                    // ---- Job 2: automatic no_scan violation after the full 40-minute deadline ----
                    var sessionsPastDeadline = await sessionRepository.GetSessionsPastDeadlineAsync();
                    var noScanType = await violationTypeRepository.GetByCodeAsync("no_scan");

                    if (noScanType is not null)
                    {
                        foreach (var session in sessionsPastDeadline)
                        {
                            await violationRepository.AddViolationAsync(session.UserId, null, noScanType.Id, session.Id);

                            await notificationRepository.CreateAsync(
                                session.UserId,
                                null,
                                "violation",
                                $"You did not scan your parking slot in time and have received a {noScanType.Points}-point violation.");
                        }
                    }

                    // ---- Job 3: automatic wrong_slot violation if not corrected within 15 minutes ----
                    var uncorrectedScans = await slotScanRepository.GetUncorrectedWrongSlotScansAsync();
                    var wrongSlotType = await violationTypeRepository.GetByCodeAsync("wrong_slot");

                    if (wrongSlotType is not null)
                    {
                        foreach (var scan in uncorrectedScans)
                        {
                            var userId = await sessionRepository.GetUserIdBySessionIdAsync(scan.SessionId);

                            await violationRepository.AddViolationAsync(userId, null, wrongSlotType.Id, scan.SessionId);

                            await notificationRepository.CreateAsync(
                                userId,
                                null,
                                "violation",
                                $"You did not move your car to the correct slot in time and have received a {wrongSlotType.Points}-point violation.");
                        }
                    }
                    // ---- Job 6: notify + free the slot once a reservation's end time has passed ----
                    var endedReservations = await reservationRepository.GetEndedReservationsNeedingNotificationAsync();
                    foreach (var reservation in endedReservations)
                    {
                        var freedSlotId = await reservationRepository.CompleteEndedReservationAsync(reservation.Id);

                        await notificationRepository.CreateAsync(
                            reservation.UserId, null, "reservation",
                            "Your reservation has ended.");

                        if (freedSlotId is not null)
                        {
                            await waitingListEngine.TryAssignFreedSlotAsync(freedSlotId.Value);
                        }
                    }

                }

                await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
            }
        }
    }
}