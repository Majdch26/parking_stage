using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class UserRepository : IUserRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public UserRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            const string sql = "SELECT COUNT(1) FROM users WHERE email = @Email";
            using var connection = _connectionFactory.CreateConnection();
            var count = await connection.ExecuteScalarAsync<int>(sql, new { Email = email });
            return count > 0;
        }

        public async Task<bool> UniversityIdExistsAsync(int universityId)
        {
            const string sql = "SELECT COUNT(1) FROM users WHERE university_id = @UniversityId";
            using var connection = _connectionFactory.CreateConnection();
            var count = await connection.ExecuteScalarAsync<int>(sql, new { UniversityId = universityId });
            return count > 0;
        }

        public async Task<int> CreateUserAsync(UserAccount user)
        {
            const string sql = """
                INSERT INTO users (university_id, first_name, last_name, email, password_hash, role, qr_token)
                VALUES (@UniversityId, @FirstName, @LastName, @Email, @PasswordHash, @Role, @QrToken);
                SELECT CAST(SCOPE_IDENTITY() AS INT);
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql, new
            {
                user.UniversityId,
                user.FirstName,
                user.LastName,
                user.Email,
                user.PasswordHash,
                user.Role,
                user.QrToken
            });
        }

        public async Task<UserAccount?> GetByEmailAsync(string email)
        {
            const string sql = """
                SELECT
                    id            AS Id,
                    university_id AS UniversityId,
                    first_name    AS FirstName,
                    last_name     AS LastName,
                    email         AS Email,
                    password_hash AS PasswordHash,
                    role          AS Role,
                    points        AS Points,
                    status        AS Status,
                    qr_token      AS QrToken,
                    created_at    AS CreatedAt
                FROM users
                WHERE email = @Email
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<UserAccount>(sql, new { Email = email });
        }

        public async Task<UserAccount?> GetByIdAsync(int id)
        {
            const string sql = """
                SELECT
                    id            AS Id,
                    university_id AS UniversityId,
                    first_name    AS FirstName,
                    last_name     AS LastName,
                    email         AS Email,
                    password_hash AS PasswordHash,
                    role          AS Role,
                    points        AS Points,
                    status        AS Status,
                    qr_token      AS QrToken,
                    created_at    AS CreatedAt
                FROM users
                WHERE id = @Id
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<UserAccount>(sql, new { Id = id });
        }
        public async Task<(int UserId, int VehicleId)> CreateUserWithVehicleAsync(UserAccount user, Vehicle vehicle)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            const string insertUserSql = """
        INSERT INTO users (university_id, first_name, last_name, email, password_hash, role, qr_token)
        VALUES (@UniversityId, @FirstName, @LastName, @Email, @PasswordHash, @Role, @QrToken);
        SELECT CAST(SCOPE_IDENTITY() AS INT);
        """;

            var userId = await connection.ExecuteScalarAsync<int>(insertUserSql, new
            {
                user.UniversityId,
                user.FirstName,
                user.LastName,
                user.Email,
                user.PasswordHash,
                user.Role,
                user.QrToken
            }, transaction);

            const string insertVehicleSql = """
        INSERT INTO vehicle (user_id, model_id, plate_number, year, color, is_primary)
        VALUES (@UserId, @ModelId, @PlateNumber, @Year, @Color, 1);
        SELECT CAST(SCOPE_IDENTITY() AS INT);
        """;

            var vehicleId = await connection.ExecuteScalarAsync<int>(insertVehicleSql, new
            {
                UserId = userId,
                vehicle.ModelId,
                vehicle.PlateNumber,
                vehicle.Year,
                vehicle.Color
            }, transaction);

            transaction.Commit();
            return (userId, vehicleId);
        }

        public async Task<UserAccount?> GetByQrTokenAsync(string qrToken)
        {
            const string sql = """
        SELECT
            id            AS Id,
            university_id AS UniversityId,
            first_name    AS FirstName,
            last_name     AS LastName,
            email         AS Email,
            password_hash AS PasswordHash,
            role          AS Role,
            points        AS Points,
            status        AS Status,
            qr_token      AS QrToken,
            created_at    AS CreatedAt
        FROM users
        WHERE qr_token = @QrToken
        """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<UserAccount>(sql, new { QrToken = qrToken });
        }

        public async Task<UserAccount?> GetByStoredIdAsync(string storedId)
        {
            const string sql = """
        SELECT
            u.id            AS Id,
            u.university_id AS UniversityId,
            u.first_name    AS FirstName,
            u.last_name     AS LastName,
            u.email         AS Email,
            u.password_hash AS PasswordHash,
            u.role          AS Role,
            u.points        AS Points,
            u.status        AS Status,
            u.qr_token      AS QrToken,
            u.created_at    AS CreatedAt
        FROM users u
        JOIN university uni ON uni.id = u.university_id
        WHERE uni.stored_id = @StoredId
        """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<UserAccount>(sql, new { StoredId = storedId });
        }
        public async Task<IEnumerable<UserSummaryResponse>> GetAllUsersAsync()
        {
            const string sql = """
        SELECT u.id AS Id, uni.stored_id AS StoredId, u.first_name AS FirstName, u.last_name AS LastName,
               u.email AS Email, u.role AS Role, u.points AS Points, u.status AS Status
        FROM users u
        LEFT JOIN university uni ON uni.id = u.university_id
        ORDER BY u.role, u.last_name
        """;
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<UserSummaryResponse>(sql);
        }

        public async Task<bool> UnbanAsync(int userId)
        {
            const string sql = "UPDATE users SET points = 0, status = 'active' WHERE id = @UserId AND status = 'blocked'";
            using var connection = _connectionFactory.CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { UserId = userId });
            return rows > 0;
        }
        public async Task<bool> UpdateBasicInfoAsync(int userId, string firstName, string lastName, string email)
        {
            const string sql = "UPDATE users SET first_name = @FirstName, last_name = @LastName, email = @Email WHERE id = @UserId";
            using var connection = _connectionFactory.CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { UserId = userId, FirstName = firstName, LastName = lastName, Email = email });
            return rows > 0;
        }
        public async Task<bool> BanAsync(int userId)
        {
            const string sql = "UPDATE users SET status = 'blocked' WHERE id = @UserId AND role <> 'admin'";
            using var connection = _connectionFactory.CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { UserId = userId });
            return rows > 0;
        }

        public async Task<bool> UpdatePasswordAsync(int userId, string passwordHash)
        {
            const string sql = "UPDATE users SET password_hash = @PasswordHash WHERE id = @UserId";
            using var connection = _connectionFactory.CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { UserId = userId, PasswordHash = passwordHash });
            return rows > 0;
        }
    }
}