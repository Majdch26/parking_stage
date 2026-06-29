using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.Engine
{
    public class NotificationEngine : INotificationEngine
    {
        private readonly INotificationRepository _notificationRepository;

        public NotificationEngine(INotificationRepository notificationRepository)
        {
            _notificationRepository = notificationRepository;
        }

        public Task<IEnumerable<NotificationResponse>> GetMyNotificationsAsync(int userId) =>
            _notificationRepository.GetByUserIdAsync(userId);

        public Task<bool> MarkAsReadAsync(int notificationId, int userId) =>
            _notificationRepository.MarkAsReadAsync(notificationId, userId);
        public Task MarkAllAsReadAsync(int userId) =>
    _notificationRepository.MarkAllAsReadAsync(userId);
    }
}