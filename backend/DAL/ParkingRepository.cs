using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class ParkingRepository : IParkingRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public ParkingRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<ParkingAreaResponse>> GetAllAreasWithAvailabilityAsync()
        {
            const string sql = """
                SELECT
                    a.id          AS Id,
                    a.area_name   AS AreaName,
                    a.description AS Description,
                    a.capacity    AS Capacity,
                    COUNT(CASE WHEN s.status = 'available' THEN 1 END) AS AvailableSlots,
                    COUNT(CASE WHEN s.status = 'occupied' THEN 1 END) AS OccupiedSlots,
                    COUNT(CASE WHEN s.status = 'reserved' THEN 1 END) AS ReservedSlots,
                    COUNT(CASE WHEN s.status = 'maintenance' THEN 1 END) AS MaintenanceSlots
                FROM parking_areas a
                LEFT JOIN parking_slots s ON s.area_id = a.id
                GROUP BY a.id, a.area_name, a.description, a.capacity
                ORDER BY a.area_name
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<ParkingAreaResponse>(sql);
        }
        public async Task<IEnumerable<SlotOption>> GetAvailableSlotsByAreaIdAsync(int areaId)
        {
            const string sql = """
        SELECT id AS Id, slot_number AS SlotNumber
        FROM parking_slots
        WHERE area_id = @AreaId AND status = 'available'
        ORDER BY slot_number
        """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<SlotOption>(sql, new { AreaId = areaId });
        }
        public async Task<IEnumerable<SlotStatusResponse>> GetAllSlotsWithStatusByAreaIdAsync(int areaId)
        {
            const string sql = """
        SELECT id AS Id, slot_number AS SlotNumber, status AS Status
        FROM parking_slots
        WHERE area_id = @AreaId
        ORDER BY slot_number
        """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<SlotStatusResponse>(sql, new { AreaId = areaId });
        }
        public async Task<IEnumerable<SlotQrInfo>> GetSlotTokensByAreaIdAsync(int areaId)
        {
            const string sql = """
        SELECT id AS Id, slot_number AS SlotNumber, slot_token AS SlotToken
        FROM parking_slots
        WHERE area_id = @AreaId
        ORDER BY slot_number
        """;
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<SlotQrInfo>(sql, new { AreaId = areaId });
        }
        public async Task<IEnumerable<AreaQrInfo>> GetAreaTokensAsync()
        {
            const string sql = "SELECT id AS Id, area_name AS AreaName, area_token AS AreaToken FROM parking_areas ORDER BY area_name";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<AreaQrInfo>(sql);
        }

        public async Task<(int AreaId, string Status)?> GetSlotAreaAndStatusAsync(int slotId)
        {
            const string sql = "SELECT area_id AS AreaId, status AS Status FROM parking_slots WHERE id = @SlotId";
            using var connection = _connectionFactory.CreateConnection();
            var row = await connection.QueryFirstOrDefaultAsync<(int AreaId, string Status)?>(sql, new { SlotId = slotId });
            return row;
        }

        public async Task SetSlotStatusAsync(int slotId, string status)
        {
            const string sql = "UPDATE parking_slots SET status = @Status WHERE id = @SlotId";
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql, new { SlotId = slotId, Status = status });
        }

        public async Task<IEnumerable<MaintenanceSlotResponse>> GetSlotsInMaintenanceAsync()
        {
            const string sql = """
                SELECT s.id AS Id, s.slot_number AS SlotNumber, a.area_name AS AreaName
                FROM parking_slots s
                JOIN parking_areas a ON a.id = s.area_id
                WHERE s.status = 'maintenance'
                ORDER BY a.area_name, s.slot_number
                """;
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<MaintenanceSlotResponse>(sql);
        }
    }
}