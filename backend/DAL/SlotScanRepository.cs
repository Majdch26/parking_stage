using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class SlotScanRepository : ISlotScanRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public SlotScanRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<ParkingSlot?> GetSlotByTokenAsync(string slotToken)
        {
            const string sql = """
                SELECT id AS Id, area_id AS AreaId, slot_number AS SlotNumber, status AS Status, slot_token AS SlotToken
                FROM parking_slots
                WHERE slot_token = @SlotToken
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<ParkingSlot>(sql, new { SlotToken = slotToken });
        }

        public async Task RecordFailedScanAsync(int sessionId, int slotId, string status)
        {
            const string sql = "INSERT INTO slot_scans (session_id, slot_id, status) VALUES (@SessionId, @SlotId, @Status)";
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql, new { SessionId = sessionId, SlotId = slotId, Status = status });
        }

        public async Task RecordSuccessfulScanAsync(int sessionId, int slotId, string status)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            const string insertScanSql = "INSERT INTO slot_scans (session_id, slot_id, status) VALUES (@SessionId, @SlotId, @Status)";
            await connection.ExecuteAsync(insertScanSql, new { SessionId = sessionId, SlotId = slotId, Status = status }, transaction);

            const string updateSessionSql = "UPDATE parking_session SET slot_id = @SlotId, status = 'parked' WHERE id = @SessionId";
            await connection.ExecuteAsync(updateSessionSql, new { SessionId = sessionId, SlotId = slotId }, transaction);

            const string updateSlotSql = "UPDATE parking_slots SET status = 'occupied' WHERE id = @SlotId";
            await connection.ExecuteAsync(updateSlotSql, new { SlotId = slotId }, transaction);

            transaction.Commit();
        }
        public async Task<string?> GetSlotNumberByIdAsync(int slotId)
        {
            const string sql = "SELECT slot_number FROM parking_slots WHERE id = @SlotId";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<string?>(sql, new { SlotId = slotId });
        }
        public async Task<IEnumerable<SlotScan>> GetUncorrectedWrongSlotScansAsync()
        {
            const string sql = """
        SELECT ws.id AS Id, ws.session_id AS SessionId, ws.slot_id AS SlotId, ws.scan_time AS ScanTime, ws.status AS Status
        FROM slot_scans ws
        WHERE ws.status = 'wrong_slot'
          AND ws.scan_time <= DATEADD(MINUTE, -15, GETDATE())
          -- only the most recent scan for this session counts as "the current situation"
          AND ws.id = (SELECT TOP 1 id FROM slot_scans WHERE session_id = ws.session_id ORDER BY scan_time DESC)
          -- skip if a violation was already issued for this specific scan
          AND NOT EXISTS (
              SELECT 1 FROM violations v
              JOIN violation_types vt ON vt.id = v.violation_type_id
              WHERE v.session_id = ws.session_id AND vt.code = 'wrong_slot' AND v.created_at >= ws.scan_time
          )
        """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<SlotScan>(sql);
        }
    }
}