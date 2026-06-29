using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class WaitingListRepository : IWaitingListRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public WaitingListRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<bool> HasActiveEntryAsync(int userId)
        {
            const string sql = "SELECT COUNT(1) FROM waiting_list WHERE user_id = @UserId AND status IN ('waiting', 'notified')";
            using var connection = _connectionFactory.CreateConnection();
            var count = await connection.ExecuteScalarAsync<int>(sql, new { UserId = userId });
            return count > 0;
        }

        public async Task<int> CreateAsync(WaitingListEntry entry)
        {
            const string sql = """
        INSERT INTO waiting_list (user_id, vehicle_id, priority_time, status)
        VALUES (@UserId, @VehicleId, @PriorityTime, 'waiting');
        SELECT CAST(SCOPE_IDENTITY() AS INT);
        """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql, new
            {
                entry.UserId,
                entry.VehicleId,
                entry.PriorityTime
            });
        }

        public async Task<IEnumerable<WaitingListResponse>> GetByUserIdAsync(int userId)
        {
            const string sql = """
                SELECT id AS Id, priority_time AS PriorityTime, joined_at AS JoinedAt, status AS Status
                FROM waiting_list
                WHERE user_id = @UserId
                ORDER BY joined_at DESC
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<WaitingListResponse>(sql, new { UserId = userId });
        }

        public async Task<WaitingListEntry?> GetNextInLineAsync()
        {
            const string sql = """
        SELECT TOP 1
            id AS Id, user_id AS UserId, vehicle_id AS VehicleId, area_id AS AreaId,
            priority_time AS PriorityTime, joined_at AS JoinedAt, status AS Status,
            offered_slot_id AS OfferedSlotId, notified_at AS NotifiedAt,
            fulfilled_at AS FulfilledAt, expired_at AS ExpiredAt
        FROM waiting_list
        WHERE status = 'waiting'
        ORDER BY priority_time ASC, joined_at ASC
        """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<WaitingListEntry>(sql);
        }

        public async Task MarkFulfilledAsync(int entryId, int slotId)
        {
            const string sql = """
                UPDATE waiting_list
                SET status = 'fulfilled', offered_slot_id = @SlotId, notified_at = GETDATE(), fulfilled_at = GETDATE()
                WHERE id = @EntryId
                """;

            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql, new { EntryId = entryId, SlotId = slotId });
        }

        public async Task<bool> CancelAsync(int entryId, int userId)
        {
            const string sql = """
                UPDATE waiting_list
                SET status = 'cancelled'
                WHERE id = @EntryId AND user_id = @UserId AND status = 'waiting'
                """;

            using var connection = _connectionFactory.CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { EntryId = entryId, UserId = userId });
            return rows > 0;
        }
        public async Task<int> GetActiveCountAsync()
        {
            const string sql = "SELECT COUNT(1) FROM waiting_list WHERE status = 'waiting'";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql);
        }
        public async Task<IEnumerable<WaitingListEntry>> GetActiveQueueAsync()
        {
            const string sql = """
        SELECT id AS Id, user_id AS UserId, vehicle_id AS VehicleId, area_id AS AreaId,
               priority_time AS PriorityTime, joined_at AS JoinedAt, status AS Status,
               offered_slot_id AS OfferedSlotId, notified_at AS NotifiedAt,
               fulfilled_at AS FulfilledAt, expired_at AS ExpiredAt
        FROM waiting_list
        WHERE status = 'waiting'
        ORDER BY priority_time ASC, joined_at ASC
        """;
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<WaitingListEntry>(sql);
        }
        public async Task<IEnumerable<WaitingListEntry>> GetEntriesNeedingTimePassedReminderAsync()
        {
            const string sql = """
        SELECT id AS Id, user_id AS UserId, vehicle_id AS VehicleId, area_id AS AreaId,
               priority_time AS PriorityTime, joined_at AS JoinedAt, status AS Status,
               offered_slot_id AS OfferedSlotId, notified_at AS NotifiedAt,
               fulfilled_at AS FulfilledAt, expired_at AS ExpiredAt
        FROM waiting_list
        WHERE status = 'waiting'
          AND priority_time <= CAST(GETDATE() AS TIME)
          AND time_passed_notified_at IS NULL
        """;
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<WaitingListEntry>(sql);
        }

        public async Task MarkTimePassedReminderSentAsync(int entryId)
        {
            const string sql = "UPDATE waiting_list SET time_passed_notified_at = GETDATE() WHERE id = @EntryId";
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql, new { EntryId = entryId });
        }
        public async Task<IEnumerable<WaitingListEntry>> GetPastDueEntriesAsync()
        {
            const string sql = """
        SELECT id AS Id, user_id AS UserId, vehicle_id AS VehicleId, area_id AS AreaId,
               priority_time AS PriorityTime, joined_at AS JoinedAt, status AS Status,
               offered_slot_id AS OfferedSlotId, notified_at AS NotifiedAt,
               fulfilled_at AS FulfilledAt, expired_at AS ExpiredAt
        FROM waiting_list
        WHERE status = 'waiting'
          AND priority_time <= CAST(GETDATE() AS TIME)
        """;
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<WaitingListEntry>(sql);
        }

        public async Task ExpireAsync(int entryId)
        {
            const string sql = "UPDATE waiting_list SET status = 'expired', expired_at = GETDATE() WHERE id = @EntryId";
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql, new { EntryId = entryId });
        }

    }
}