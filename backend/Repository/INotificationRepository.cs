using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Repository
{
    public interface INotificationRepository
    {
        /// <summary>Creates a new notification -- called both by users directly and by the background service later.</summary>
        Task CreateAsync(int receiverId, int? senderId, string type, string message, int? relatedId = null);

        /// <summary>A user's own notifications, most recent first.</summary>
        Task<IEnumerable<NotificationResponse>> GetByUserIdAsync(int userId);

        /// <summary>Marks one notification as read -- only if it belongs to this user.</summary>
        Task<bool> MarkAsReadAsync(int notificationId, int userId);
        /// <summary>Marks every unread notification belonging to this user as read, in one go.</summary>
        Task MarkAllAsReadAsync(int userId);
    }
}
