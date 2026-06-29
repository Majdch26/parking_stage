using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class VehicleReferenceRepository : IVehicleReferenceRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public VehicleReferenceRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<Brand>> GetAllBrandsAsync()
        {
            const string sql = "SELECT id AS Id, name AS Name FROM brand ORDER BY name";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<Brand>(sql);
        }

        public async Task<IEnumerable<ModelResponse>> GetModelsByBrandIdAsync(int brandId)
        {
            const string sql = """
                SELECT
                    m.id          AS Id,
                    m.name        AS Name,
                    vt.code       AS VehicleTypeCode,
                    vt.name       AS VehicleTypeName
                FROM model m
                JOIN vehicle_type vt ON vt.id = m.vehicle_type_id
                WHERE m.brand_id = @BrandId
                ORDER BY m.name
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<ModelResponse>(sql, new { BrandId = brandId });
        }

        public async Task<VehicleModelDetails?> GetModelDetailsByIdAsync(int modelId)
        {
            const string sql = """
                SELECT
                    m.id    AS Id,
                    m.name  AS ModelName,
                    b.name  AS BrandName,
                    vt.name AS VehicleTypeName
                FROM model m
                JOIN brand b ON b.id = m.brand_id
                JOIN vehicle_type vt ON vt.id = m.vehicle_type_id
                WHERE m.id = @ModelId
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<VehicleModelDetails>(sql, new { ModelId = modelId });
        }
    }
}