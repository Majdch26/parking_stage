using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class WorkerChatRepository : IWorkerChatRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public WorkerChatRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<WorkerChatMessageResponse>> GetRecentAsync(int take = 100)
        {
            const string sql = """
                SELECT TOP (@Take)
                    m.id AS Id,
                    m.sender_id AS SenderId,
                    u.first_name + ' ' + u.last_name AS SenderName,
                    m.message AS Message,
                    m.created_at AS CreatedAt
                FROM worker_chat_messages m
                JOIN users u ON u.id = m.sender_id
                ORDER BY m.id DESC
                """;
            using var connection = _connectionFactory.CreateConnection();
            var rows = await connection.QueryAsync<WorkerChatMessageResponse>(sql, new { Take = take });
            return rows.Reverse(); // oldest first, ready to render top-to-bottom
        }

        public async Task<IEnumerable<WorkerChatMessageResponse>> GetSinceAsync(int afterId)
        {
            const string sql = """
                SELECT
                    m.id AS Id,
                    m.sender_id AS SenderId,
                    u.first_name + ' ' + u.last_name AS SenderName,
                    m.message AS Message,
                    m.created_at AS CreatedAt
                FROM worker_chat_messages m
                JOIN users u ON u.id = m.sender_id
                WHERE m.id > @AfterId
                ORDER BY m.id ASC
                """;
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<WorkerChatMessageResponse>(sql, new { AfterId = afterId });
        }

        public async Task<int> SendAsync(int senderId, string message)
        {
            const string sql = """
                INSERT INTO worker_chat_messages (sender_id, message)
                OUTPUT INSERTED.id
                VALUES (@SenderId, @Message)
                """;
            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql, new { SenderId = senderId, Message = message });
        }
    }
}

