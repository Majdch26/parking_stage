using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.BackgroundServices
{
    /// <summary>
    /// Every Sunday, once, nudges every worker to fill in their shift schedule for next week.
    /// Runs continuously and only actually sends something on the one Sunday check that
    /// hits the 9:00 AM window, so it fires once instead of every loop.
    /// </summary>
    public class WorkerScheduleReminderBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private DateTime? _lastReminderSentOn;

        public WorkerScheduleReminderBackgroundService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.Now;
                var isSundayReminderWindow = now.DayOfWeek == DayOfWeek.Sunday && now.Hour == 9;
                var alreadySentToday = _lastReminderSentOn?.Date == now.Date;

                if (isSundayReminderWindow && !alreadySentToday)
                {
                    using var scope = _serviceProvider.CreateScope();
                    var scheduleRepository = scope.ServiceProvider.GetRequiredService<IWorkerScheduleRepository>();
                    var notificationRepository = scope.ServiceProvider.GetRequiredService<INotificationRepository>();

                    var workerIds = await scheduleRepository.GetAllWorkerIdsAsync();
                    foreach (var workerId in workerIds)
                    {
                        await notificationRepository.CreateAsync(
                            workerId, null, "schedule_reminder",
                            "Remember, you should do your schedule today for next week!");
                    }

                    _lastReminderSentOn = now.Date;
                }

                await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
            }
        }
    }
}