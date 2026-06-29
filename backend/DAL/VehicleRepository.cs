using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class VehicleRepository : IVehicleRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public VehicleRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<bool> PlateNumberExistsAsync(string plateNumber)
        {
            const string sql = "SELECT COUNT(1) FROM vehicle WHERE plate_number = @PlateNumber";
            using var connection = _connectionFactory.CreateConnection();
            var count = await connection.ExecuteScalarAsync<int>(sql, new { PlateNumber = plateNumber });
            return count > 0;
        }

        public async Task ClearPrimaryForUserAsync(int userId)
        {
            const string sql = "UPDATE vehicle SET is_primary = 0 WHERE user_id = @UserId AND is_primary = 1";
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql, new { UserId = userId });
        }

        public async Task<int> CreateVehicleAsync(Vehicle vehicle)
        {
            const string sql = """
                INSERT INTO vehicle (user_id, model_id, plate_number, year, color, is_primary)
                VALUES (@UserId, @ModelId, @PlateNumber, @Year, @Color, @IsPrimary);
                SELECT CAST(SCOPE_IDENTITY() AS INT);
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql, new
            {
                vehicle.UserId,
                vehicle.ModelId,
                vehicle.PlateNumber,
                vehicle.Year,
                vehicle.Color,
                vehicle.IsPrimary
            });
        }

        public async Task<IEnumerable<VehicleResponse>> GetByUserIdAsync(int userId)
        {
            const string sql = """
                SELECT
                    v.id          AS Id,
                    v.plate_number AS PlateNumber,
                    v.year        AS Year,
                    v.color       AS Color,
                    v.is_primary  AS IsPrimary,
                    v.status      AS Status,
                    b.name        AS BrandName,
                    m.name        AS ModelName,
                    vt.name       AS VehicleTypeName
                FROM vehicle v
                JOIN model m ON m.id = v.model_id
                JOIN brand b ON b.id = m.brand_id
                JOIN vehicle_type vt ON vt.id = m.vehicle_type_id
                WHERE v.user_id = @UserId AND v.status = 'active'
                ORDER BY v.is_primary DESC, v.id
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<VehicleResponse>(sql, new { UserId = userId });
        }

        public async Task DeactivateAsync(int vehicleId)
        {
            const string sql = "UPDATE vehicle SET status = 'inactive' WHERE id = @VehicleId";
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql, new { VehicleId = vehicleId });
        }

        public async Task SetPrimaryAsync(int vehicleId, int userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            const string clearSql = "UPDATE vehicle SET is_primary = 0 WHERE user_id = @UserId AND is_primary = 1";
            await connection.ExecuteAsync(clearSql, new { UserId = userId }, transaction);

            const string setSql = "UPDATE vehicle SET is_primary = 1 WHERE id = @VehicleId";
            await connection.ExecuteAsync(setSql, new { VehicleId = vehicleId }, transaction);

            transaction.Commit();
        }
    }
}