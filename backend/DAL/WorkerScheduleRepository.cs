using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class WorkerScheduleRepository : IWorkerScheduleRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public WorkerScheduleRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<WorkerScheduleResponse>> GetByWorkerAndRangeAsync(int workerId, DateTime from, DateTime to)
        {
            const string sql = """
                SELECT id AS Id, schedule_date AS ScheduleDate, shift_code AS ShiftCode
                FROM worker_schedules
                WHERE worker_id = @WorkerId AND schedule_date BETWEEN @From AND @To
                ORDER BY schedule_date, shift_code
                """;
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<WorkerScheduleResponse>(sql, new { WorkerId = workerId, From = from.Date, To = to.Date });
        }

        public async Task<bool> ExistsAsync(int workerId, DateTime date, string shiftCode)
        {
            const string sql = """
                SELECT COUNT(1) FROM worker_schedules
                WHERE worker_id = @WorkerId AND schedule_date = @Date AND shift_code = @ShiftCode
                """;
            using var connection = _connectionFactory.CreateConnection();
            var count = await connection.ExecuteScalarAsync<int>(sql, new { WorkerId = workerId, Date = date.Date, ShiftCode = shiftCode });
            return count > 0;
        }

        public async Task ReserveAsync(int workerId, DateTime date, string shiftCode)
        {
            const string sql = """
                INSERT INTO worker_schedules (worker_id, schedule_date, shift_code)
                VALUES (@WorkerId, @Date, @ShiftCode)
                """;
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql, new { WorkerId = workerId, Date = date.Date, ShiftCode = shiftCode });
        }

        public async Task UnreserveAsync(int workerId, DateTime date, string shiftCode)
        {
            const string sql = """
                DELETE FROM worker_schedules
                WHERE worker_id = @WorkerId AND schedule_date = @Date AND shift_code = @ShiftCode
                """;
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql, new { WorkerId = workerId, Date = date.Date, ShiftCode = shiftCode });
        }

        public async Task<IEnumerable<int>> GetAllWorkerIdsAsync()
        {
            const string sql = "SELECT id FROM users WHERE role = 'worker'";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<int>(sql);
        }

        public async Task<IEnumerable<WorkerScheduleOverviewItem>> GetAllForWeekAsync(DateTime from, DateTime to)
        {
            const string sql = """
                SELECT
                    ws.worker_id AS WorkerId,
                    u.first_name + ' ' + u.last_name AS WorkerName,
                    ws.schedule_date AS ScheduleDate,
                    ws.shift_code AS ShiftCode
                FROM worker_schedules ws
                JOIN users u ON u.id = ws.worker_id
                WHERE ws.schedule_date BETWEEN @From AND @To
                ORDER BY u.first_name, u.last_name, ws.schedule_date, ws.shift_code
                """;
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<WorkerScheduleOverviewItem>(sql, new { From = from.Date, To = to.Date });
        }
    }
}
