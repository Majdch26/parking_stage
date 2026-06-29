using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    public interface INotificationEngine
    {
        Task<IEnumerable<NotificationResponse>> GetMyNotificationsAsync(int userId);
        Task<bool> MarkAsReadAsync(int notificationId, int userId);
        Task MarkAllAsReadAsync(int userId);
    }
}