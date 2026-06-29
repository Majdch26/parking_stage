using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class WorkerShiftRepository : IWorkerShiftRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public WorkerShiftRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<bool> IsAreaAlreadyCoveredAsync(int areaId)
        {
            const string sql = "SELECT COUNT(1) FROM users WHERE checked_in_area_id = @AreaId";
            using var connection = _connectionFactory.CreateConnection();
            var count = await connection.ExecuteScalarAsync<int>(sql, new { AreaId = areaId });
            return count > 0;
        }

        public async Task CheckInAsync(int workerId, int areaId)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            const string updateUserSql = "UPDATE users SET checked_in_area_id = @AreaId WHERE id = @WorkerId";
            await connection.ExecuteAsync(updateUserSql, new { AreaId = areaId, WorkerId = workerId }, transaction);

            const string insertShiftSql = """
        INSERT INTO worker_shifts (worker_id, area_id, check_in_time)
        VALUES (@WorkerId, @AreaId, GETDATE())
        """;
            await connection.ExecuteAsync(insertShiftSql, new { WorkerId = workerId, AreaId = areaId }, transaction);

            transaction.Commit();
        }

        public async Task<bool> CheckOutAsync(int workerId)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            const string getCurrentSql = "SELECT checked_in_area_id FROM users WHERE id = @WorkerId";
            var currentAreaId = await connection.QueryFirstOrDefaultAsync<int?>(getCurrentSql, new { WorkerId = workerId }, transaction);

            if (currentAreaId is null)
            {
                transaction.Rollback();
                return false;
            }

            const string clearUserSql = "UPDATE users SET checked_in_area_id = NULL WHERE id = @WorkerId";
            await connection.ExecuteAsync(clearUserSql, new { WorkerId = workerId }, transaction);

            const string closeShiftSql = """
                UPDATE worker_shifts
                SET check_out_time = GETDATE()
                WHERE worker_id = @WorkerId AND check_out_time IS NULL
                """;
            await connection.ExecuteAsync(closeShiftSql, new { WorkerId = workerId }, transaction);

            transaction.Commit();
            return true;
        }

        public async Task<IEnumerable<int>> GetCheckedInWorkerIdsByAreaAsync(int areaId)
        {
            const string sql = "SELECT id FROM users WHERE checked_in_area_id = @AreaId AND role = 'worker'";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<int>(sql, new { AreaId = areaId });
        }

        public async Task<IEnumerable<int>> GetAllCheckedInWorkerIdsAsync()
        {
            const string sql = "SELECT id FROM users WHERE checked_in_area_id IS NOT NULL AND role = 'worker'";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<int>(sql);
        }

        public async Task<int?> GetAreaIdByTokenAsync(string areaToken)
        {
            const string sql = "SELECT id FROM parking_areas WHERE area_token = @AreaToken";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<int?>(sql, new { AreaToken = areaToken });
        }

        public async Task<IEnumerable<WorkerShiftResponse>> GetMyShiftsAsync(int workerId)
        {
            const string sql = """
                SELECT
                    ws.id AS Id,
                    a.area_name AS AreaName,
                    ws.check_in_time AS CheckInTime,
                    ws.check_out_time AS CheckOutTime
                FROM worker_shifts ws
                JOIN parking_areas a ON a.id = ws.area_id
                WHERE ws.worker_id = @WorkerId
                ORDER BY ws.check_in_time DESC
                """;
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<WorkerShiftResponse>(sql, new { WorkerId = workerId });
        }
        public async Task<int?> GetCurrentAreaIdAsync(int workerId)
        {
            const string sql = "SELECT checked_in_area_id FROM users WHERE id = @WorkerId";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<int?>(sql, new { WorkerId = workerId });
        }

        public async Task<IEnumerable<WorkerZoneStatusResponse>> GetZonesWithStatusAsync()
        {
            const string sql = """
                SELECT
                    a.id AS AreaId,
                    a.area_name AS AreaName,
                    CASE WHEN EXISTS (
                        SELECT 1 FROM users u WHERE u.checked_in_area_id = a.id
                    ) THEN 1 ELSE 0 END AS IsCovered
                FROM parking_areas a
                ORDER BY a.area_name
                """;
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<WorkerZoneStatusResponse>(sql);
        }

        public async Task<IEnumerable<ActiveWorkerResponse>> GetActiveWorkersAsync()
        {
            // "Currently at the parking" = an open shift right now -- join the open
            // worker_shifts row instead of users.checked_in_area_id so we also get the
            // real check-in time to show, not just a yes/no.
            const string sql = """
                SELECT
                    u.id AS WorkerId,
                    u.first_name + ' ' + u.last_name AS WorkerName,
                    a.area_name AS AreaName,
                    ws.check_in_time AS CheckInTime
                FROM worker_shifts ws
                JOIN users u ON u.id = ws.worker_id
                JOIN parking_areas a ON a.id = ws.area_id
                WHERE ws.check_out_time IS NULL
                ORDER BY ws.check_in_time
                """;
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<ActiveWorkerResponse>(sql);
        }
    }
}