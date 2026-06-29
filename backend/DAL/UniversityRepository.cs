using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class UniversityRepository : IUniversityRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public UniversityRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<UniversityRecord?> GetByStoredIdAsync(string storedId)
        {
            const string sql = """
                SELECT
                    id          AS Id,
                    stored_id   AS StoredId,
                    first_name  AS FirstName,
                    last_name   AS LastName,
                    email       AS Email,
                    person_type AS PersonType
                FROM university
                WHERE stored_id = @StoredId
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<UniversityRecord>(sql, new { StoredId = storedId });
        }
    }
}