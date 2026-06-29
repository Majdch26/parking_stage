using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class ViolationRepository : IViolationRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public ViolationRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<ViolationType?> GetViolationTypeByIdAsync(int violationTypeId)
        {
            const string sql = "SELECT id AS Id, code AS Code, description AS Description, points AS Points FROM violation_types WHERE id = @Id";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<ViolationType>(sql, new { Id = violationTypeId });
        }

        public async Task<(int NewTotalPoints, bool JustBanned, int ViolationId)> AddViolationAsync(
            int studentId, int? workerId, int violationTypeId, int? sessionId)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            const string getPointsSql = "SELECT points FROM violation_types WHERE id = @ViolationTypeId";
            var pointsToAdd = await connection.ExecuteScalarAsync<int>(
                getPointsSql, new { ViolationTypeId = violationTypeId }, transaction);

            const string updatePointsSql = """
                UPDATE users SET points = points + @PointsToAdd WHERE id = @StudentId;
                SELECT points FROM users WHERE id = @StudentId;
                """;
            var newTotal = await connection.ExecuteScalarAsync<int>(
                updatePointsSql, new { PointsToAdd = pointsToAdd, StudentId = studentId }, transaction);

            var justBanned = false;
            if (newTotal >= 100)
            {
                const string banSql = "UPDATE users SET status = 'blocked' WHERE id = @StudentId AND status != 'blocked'";
                var rowsAffected = await connection.ExecuteAsync(banSql, new { StudentId = studentId }, transaction);
                justBanned = rowsAffected > 0;
            }

            const string insertViolationSql = """
                INSERT INTO violations (student_id, worker_id, violation_type_id, session_id, points_at_time)
                VALUES (@StudentId, @WorkerId, @ViolationTypeId, @SessionId, @PointsAtTime);
                SELECT CAST(SCOPE_IDENTITY() AS INT);
                """;
            var violationId = await connection.ExecuteScalarAsync<int>(insertViolationSql, new
            {
                StudentId = studentId,
                WorkerId = workerId,
                ViolationTypeId = violationTypeId,
                SessionId = sessionId,
                PointsAtTime = newTotal
            }, transaction);

            transaction.Commit();
            return (newTotal, justBanned, violationId);
        }

        public async Task<IEnumerable<ViolationResponse>> GetByStudentIdAsync(int studentId)
        {
            const string sql = """
                SELECT
                    v.id AS Id,
                    u.first_name + ' ' + u.last_name AS StudentName,
                    vt.code AS ViolationTypeCode,
                    vt.points AS Points,
                    v.points_at_time AS PointsAtTime,
                    v.created_at AS CreatedAt
                FROM violations v
                JOIN violation_types vt ON vt.id = v.violation_type_id
                JOIN users u ON u.id = v.student_id
                WHERE v.student_id = @StudentId
                ORDER BY v.created_at DESC
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<ViolationResponse>(sql, new { StudentId = studentId });
        }
    }
}