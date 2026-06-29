using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public NotificationRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task CreateAsync(int receiverId, int? senderId, string type, string message, int? relatedId = null)
        {
            const string sql = """
        INSERT INTO notification (receiver_id, sender_id, type, message, related_id)
        VALUES (@ReceiverId, @SenderId, @Type, @Message, @RelatedId)
        """;

            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql, new { ReceiverId = receiverId, SenderId = senderId, Type = type, Message = message, RelatedId = relatedId });
        }


        public async Task<IEnumerable<NotificationResponse>> GetByUserIdAsync(int userId)
        {
            const string sql = """
        SELECT id AS Id, type AS Type, message AS Message, is_read AS IsRead, created_at AS CreatedAt, related_id AS RelatedId
        FROM notification
        WHERE receiver_id = @UserId
        ORDER BY created_at DESC
        """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<NotificationResponse>(sql, new { UserId = userId });
        }

        public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
        {
            const string sql = "UPDATE notification SET is_read = 1 WHERE id = @NotificationId AND receiver_id = @UserId";
            using var connection = _connectionFactory.CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { NotificationId = notificationId, UserId = userId });
            return rows > 0;
        }
        public async Task MarkAllAsReadAsync(int userId)
        {
            const string sql = "UPDATE notification SET is_read = 1 WHERE receiver_id = @UserId AND is_read = 0";
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql, new { UserId = userId });
        }
    }
}