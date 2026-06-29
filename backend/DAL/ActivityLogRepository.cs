using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class ActivityLogRepository : IActivityLogRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public ActivityLogRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<SessionHistoryItem>> GetAllAsync()
        {
            // Same shape as a student's own /Session/history/{id}, just across every
            // student at once and with the student's name attached for display.
            const string sessionsSql = """
                SELECT
                    ps.id AS SessionId,
                    ps.user_id AS StudentId,
                    u.first_name + ' ' + u.last_name AS StudentName,
                    ps.entry_time AS EntryTime,
                    ps.exit_time AS ExitTime,
                    ps.status AS Status,
                    s.slot_number AS SlotNumber,
                    a.area_name AS AreaName,
                    CASE WHEN ps.reservation_id IS NOT NULL THEN 1 ELSE 0 END AS HasReservation,
                    r.reservation_date AS ReservationDate,
                    r.scheduled_entry_time AS ReservationTime,
                    rs.slot_number AS ReservationSlotNumber,
                    ra.area_name AS ReservationAreaName
                FROM parking_session ps
                JOIN users u ON u.id = ps.user_id
                LEFT JOIN parking_slots s ON s.id = ps.slot_id
                LEFT JOIN parking_areas a ON a.id = s.area_id
                LEFT JOIN reservation r ON r.id = ps.reservation_id
                LEFT JOIN parking_slots rs ON rs.id = r.slot_id
                LEFT JOIN parking_areas ra ON ra.id = rs.area_id
                ORDER BY ps.entry_time DESC
                """;

            using var connection = _connectionFactory.CreateConnection();
            var sessions = (await connection.QueryAsync<SessionHistoryItem>(sessionsSql)).ToList();

            foreach (var session in sessions)
            {
                const string violationsSql = """
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
                    WHERE v.session_id = @SessionId
                    ORDER BY v.created_at DESC
                    """;
                session.Violations = (await connection.QueryAsync<ViolationResponse>(violationsSql, new { session.SessionId })).ToList();

                const string assistanceSql = """
                    SELECT
                        ar.id AS Id,
                        su.first_name + ' ' + su.last_name AS StudentName,
                        a.area_name AS AreaName,
                        s.slot_number AS SlotNumber,
                        ar.request_type AS RequestType,
                        ar.details AS Details,
                        ar.status AS Status,
                        wu.first_name + ' ' + wu.last_name AS WorkerName,
                        ar.created_at AS CreatedAt,
                        ar.resolved_at AS ResolvedAt
                    FROM assistance_requests ar
                    JOIN parking_slots s ON s.id = ar.slot_id
                    JOIN parking_areas a ON a.id = s.area_id
                    JOIN users su ON su.id = ar.user_id
                    LEFT JOIN users wu ON wu.id = ar.worker_id
                    WHERE ar.user_id = @StudentId
                      AND ar.created_at >= @EntryTime
                      AND (@ExitTime IS NULL OR ar.created_at <= @ExitTime)
                    ORDER BY ar.created_at DESC
                    """;
                session.AssistanceRequests = (await connection.QueryAsync<AssistanceRequestResponse>(
                    assistanceSql, new { session.StudentId, session.EntryTime, session.ExitTime })).ToList();
            }

            return sessions;
        }

        public async Task<IEnumerable<WorkerShiftHistoryItem>> GetAllWorkerShiftsAsync()
        {
            const string shiftsSql = """
                SELECT
                    ws.id AS ShiftId,
                    ws.worker_id AS WorkerId,
                    u.first_name + ' ' + u.last_name AS WorkerName,
                    a.area_name AS AreaName,
                    ws.check_in_time AS CheckInTime,
                    ws.check_out_time AS CheckOutTime
                FROM worker_shifts ws
                JOIN users u ON u.id = ws.worker_id
                JOIN parking_areas a ON a.id = ws.area_id
                ORDER BY ws.check_in_time DESC
                """;

            using var connection = _connectionFactory.CreateConnection();
            var shifts = (await connection.QueryAsync<WorkerShiftHistoryItem>(shiftsSql)).ToList();

            foreach (var shift in shifts)
            {
                const string assistanceSql = """
                    SELECT
                        ar.id AS Id,
                        su.first_name + ' ' + su.last_name AS StudentName,
                        a.area_name AS AreaName,
                        s.slot_number AS SlotNumber,
                        ar.request_type AS RequestType,
                        ar.details AS Details,
                        ar.status AS Status,
                        wu.first_name + ' ' + wu.last_name AS WorkerName,
                        ar.created_at AS CreatedAt,
                        ar.resolved_at AS ResolvedAt
                    FROM assistance_requests ar
                    JOIN parking_slots s ON s.id = ar.slot_id
                    JOIN parking_areas a ON a.id = s.area_id
                    JOIN users su ON su.id = ar.user_id
                    LEFT JOIN users wu ON wu.id = ar.worker_id
                    WHERE ar.worker_id = @WorkerId
                      AND ar.created_at >= @CheckInTime
                      AND (@CheckOutTime IS NULL OR ar.created_at <= @CheckOutTime)
                    ORDER BY ar.created_at DESC
                    """;
                shift.AssistanceRequests = (await connection.QueryAsync<AssistanceRequestResponse>(
                    assistanceSql, new { shift.WorkerId, shift.CheckInTime, shift.CheckOutTime })).ToList();
            }

            return shifts;
        }
    }
}