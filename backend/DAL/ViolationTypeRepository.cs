using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class ViolationTypeRepository : IViolationTypeRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public ViolationTypeRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<bool> CodeExistsAsync(string code)
        {
            const string sql = "SELECT COUNT(1) FROM violation_types WHERE code = @Code";
            using var connection = _connectionFactory.CreateConnection();
            var count = await connection.ExecuteScalarAsync<int>(sql, new { Code = code });
            return count > 0;
        }

        public async Task<int> CreateAsync(ViolationType violationType)
        {
            const string sql = """
                INSERT INTO violation_types (code, description, points)
                VALUES (@Code, @Description, @Points);
                SELECT CAST(SCOPE_IDENTITY() AS INT);
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql, new
            {
                violationType.Code,
                violationType.Description,
                violationType.Points
            });
        }

        public async Task<IEnumerable<ViolationType>> GetAllAsync()
        {
            const string sql = "SELECT id AS Id, code AS Code, description AS Description, points AS Points FROM violation_types ORDER BY code";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<ViolationType>(sql);
        }
        public async Task<ViolationType?> GetByCodeAsync(string code)
        {
            const string sql = "SELECT id AS Id, code AS Code, description AS Description, points AS Points FROM violation_types WHERE code = @Code";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<ViolationType>(sql, new { Code = code });
        }
        public async Task<IEnumerable<ViolationType>> GetManuallyAssignableTypesAsync()
        {
            const string sql = """
        SELECT id AS Id, code AS Code, description AS Description, points AS Points
        FROM violation_types
        WHERE code NOT IN ('no_scan', 'wrong_slot')
        ORDER BY code
        """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<ViolationType>(sql);
        }
        public async Task<bool> UpdateAsync(int id, string? description, int points)
        {
            const string sql = "UPDATE violation_types SET description = @Description, points = @Points WHERE id = @Id";
            using var connection = _connectionFactory.CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { Id = id, Description = description, Points = points });
            return rows > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            // If any violation was ever recorded with this type, the FK on violations.violation_type_id
            // blocks the delete -- check first so we can give a clear reason instead of a raw SQL error.
            const string inUseSql = "SELECT COUNT(1) FROM violations WHERE violation_type_id = @Id";
            using var connection = _connectionFactory.CreateConnection();
            var inUseCount = await connection.ExecuteScalarAsync<int>(inUseSql, new { Id = id });
            if (inUseCount > 0)
            {
                return false;
            }

            const string sql = "DELETE FROM violation_types WHERE id = @Id";
            var rows = await connection.ExecuteAsync(sql, new { Id = id });
            return rows > 0;
        }
    }
}
