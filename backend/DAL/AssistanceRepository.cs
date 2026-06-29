using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class AssistanceRepository : IAssistanceRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public AssistanceRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<int> GetAreaIdBySlotIdAsync(int slotId)
        {
            const string sql = "SELECT area_id FROM parking_slots WHERE id = @SlotId";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql, new { SlotId = slotId });
        }

        public async Task<int> CreateAsync(int userId, int slotId, string requestType, string? details)
        {
            const string sql = """
                INSERT INTO assistance_requests (user_id, slot_id, request_type, details)
                VALUES (@UserId, @SlotId, @RequestType, @Details);
                SELECT CAST(SCOPE_IDENTITY() AS INT);
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql, new { UserId = userId, SlotId = slotId, RequestType = requestType, Details = details });
        }

        public async Task<bool> AcceptAsync(int requestId, int workerId)
        {
            const string sql = """
                UPDATE assistance_requests
                SET status = 'in_progress', worker_id = @WorkerId
                WHERE id = @RequestId AND status = 'pending'
                """;

            using var connection = _connectionFactory.CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { RequestId = requestId, WorkerId = workerId });
            return rows > 0;
        }

        public async Task<bool> ResolveAsync(int requestId, int workerId)
        {
            const string sql = """
                UPDATE assistance_requests
                SET status = 'resolved', resolved_at = GETDATE()
                WHERE id = @RequestId AND worker_id = @WorkerId AND status = 'in_progress'
                """;

            using var connection = _connectionFactory.CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { RequestId = requestId, WorkerId = workerId });
            return rows > 0;
        }

        public async Task<IEnumerable<AssistanceRequestResponse>> GetMyRequestsAsync(int userId)
        {
            const string sql = """
                SELECT
                    ar.id AS Id,
                    su.first_name + ' ' + su.last_name AS StudentName,
                    a.area_name AS AreaName,
                    s.slot_number AS SlotNumber,
                    ar.request_type AS RequestType,
                    ar.details AS Details,
                    ar.status AS Status,
                    wu.first_name + ' ' + wu.last_name AS WorkerName,
                    ar.created_at AS CreatedAt,
                    ar.resolved_at AS ResolvedAt
                FROM assistance_requests ar
                JOIN parking_slots s ON s.id = ar.slot_id
                JOIN parking_areas a ON a.id = s.area_id
                JOIN users su ON su.id = ar.user_id
                LEFT JOIN users wu ON wu.id = ar.worker_id
                WHERE ar.user_id = @UserId
                ORDER BY ar.created_at DESC
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<AssistanceRequestResponse>(sql, new { UserId = userId });
        }

        public async Task<IEnumerable<AssistanceRequestResponse>> GetMyAcceptedRequestsAsync(int workerId)
        {
            const string sql = """
                SELECT
                    ar.id AS Id,
                    su.first_name + ' ' + su.last_name AS StudentName,
                    a.area_name AS AreaName,
                    s.slot_number AS SlotNumber,
                    ar.request_type AS RequestType,
                    ar.details AS Details,
                    ar.status AS Status,
                    wu.first_name + ' ' + wu.last_name AS WorkerName,
                    ar.created_at AS CreatedAt,
                    ar.resolved_at AS ResolvedAt
                FROM assistance_requests ar
                JOIN parking_slots s ON s.id = ar.slot_id
                JOIN parking_areas a ON a.id = s.area_id
                JOIN users su ON su.id = ar.user_id
                LEFT JOIN users wu ON wu.id = ar.worker_id
                WHERE ar.worker_id = @WorkerId
                ORDER BY ar.created_at DESC
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<AssistanceRequestResponse>(sql, new { WorkerId = workerId });
        }

        public async Task<IEnumerable<AssistanceRequestResponse>> GetPendingRequestsAsync(int? areaId)
        {
            const string sql = """
                SELECT
                    ar.id AS Id,
                    su.first_name + ' ' + su.last_name AS StudentName,
                    a.area_name AS AreaName,
                    s.slot_number AS SlotNumber,
                    ar.request_type AS RequestType,
                    ar.details AS Details,
                    ar.status AS Status,
                    wu.first_name + ' ' + wu.last_name AS WorkerName,
                    ar.created_at AS CreatedAt,
                    ar.resolved_at AS ResolvedAt
                FROM assistance_requests ar
                JOIN parking_slots s ON s.id = ar.slot_id
                JOIN parking_areas a ON a.id = s.area_id
                JOIN users su ON su.id = ar.user_id
                LEFT JOIN users wu ON wu.id = ar.worker_id
                WHERE ar.status = 'pending'
                  AND (@AreaId IS NULL OR a.id = @AreaId)
                ORDER BY ar.created_at ASC
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<AssistanceRequestResponse>(sql, new { AreaId = areaId });
        }

        public async Task<int> GetUserIdByRequestIdAsync(int requestId)
        {
            const string sql = "SELECT user_id FROM assistance_requests WHERE id = @RequestId";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql, new { RequestId = requestId });
        }
    }
}