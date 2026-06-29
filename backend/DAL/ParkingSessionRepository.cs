using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;
using System.Linq;

namespace ParkingUniversitySystem.DAL
{
    public class ParkingSessionRepository : IParkingSessionRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public ParkingSessionRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<Reservation?> GetActiveReservationForEntryAsync(int userId)
        {
            // Only one active reservation can ever exist per user (our own rule from earlier),
            // so there's no need to filter by date/time -- if one exists at all, it's the one.
            const string sql = """
                SELECT TOP 1
                    id AS Id, user_id AS UserId, vehicle_id AS VehicleId, slot_id AS SlotId,
                    reservation_date AS ReservationDate, scheduled_entry_time AS ScheduledEntryTime, status AS Status
                FROM reservation
                WHERE user_id = @UserId AND status IN ('pending', 'confirmed')
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<Reservation>(sql, new { UserId = userId });
        }

        public async Task<int> CreateSessionAsync(ParkingSession session)
        {
            const string sql = """
                INSERT INTO parking_session (user_id, vehicle_id, reservation_id, slot_id, entry_time, status, slot_scan_deadline)
                VALUES (@UserId, @VehicleId, @ReservationId, @SlotId, @EntryTime, @Status, @SlotScanDeadline);
                SELECT CAST(SCOPE_IDENTITY() AS INT);
                """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql, new
            {
                session.UserId,
                session.VehicleId,
                session.ReservationId,
                session.SlotId,
                session.EntryTime,
                session.Status,
                session.SlotScanDeadline
            });

        }
        public async Task<ParkingSession?> GetActiveSessionByUserIdAsync(int userId)
        {
            const string sql = """
        SELECT TOP 1
            id AS Id, user_id AS UserId, vehicle_id AS VehicleId, reservation_id AS ReservationId,
            slot_id AS SlotId, entry_time AS EntryTime, exit_time AS ExitTime, status AS Status,
            slot_scan_deadline AS SlotScanDeadline
        FROM parking_session
        WHERE user_id = @UserId AND status = 'entered'
        ORDER BY entry_time DESC
        """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<ParkingSession>(sql, new { UserId = userId });
        }
        public async Task<SessionStatusResponse?> GetMostRecentSessionStatusByUserIdAsync(int userId)
        {
            const string sql = """
        SELECT TOP 1
            ps.id AS SessionId,
            ps.entry_time AS EntryTime,
            ps.exit_time AS ExitTime,
            ps.status AS Status
        FROM parking_session ps
        WHERE ps.user_id = @UserId
        ORDER BY ps.entry_time DESC
        """;

            using var connection = _connectionFactory.CreateConnection();
            var session = await connection.QueryFirstOrDefaultAsync<SessionStatusResponse>(sql, new { UserId = userId });

            // Reservation info is completely independent of whether a gate session exists yet.
            // It shows the moment the student reserves -- even before they've ever entered the
            // gate -- and disappears the moment it's no longer 'confirmed' (i.e. once they exit
            // and ExitAsync flips it to 'used', or it gets cancelled/expired).
            const string reservationSql = """
                SELECT TOP 1
                    r.reservation_date AS ReservationDate,
                    r.scheduled_entry_time AS ReservationTime,
                    s.slot_number AS ReservationSlotNumber,
                    a.area_name AS ReservationAreaName
                FROM reservation r
                JOIN parking_slots s ON s.id = r.slot_id
                JOIN parking_areas a ON a.id = s.area_id
                WHERE r.user_id = @UserId AND r.status = 'confirmed'
                ORDER BY r.reservation_date DESC, r.scheduled_entry_time DESC
                """;
            var reservationInfo = await connection.QueryFirstOrDefaultAsync<SessionStatusResponse>(
                reservationSql, new { UserId = userId });

            var hasReservation = reservationInfo is not null;

            // If there's neither a gate session at all nor an active reservation, there's truly
            // nothing to show.
            if (session is null && !hasReservation)
            {
                return null;
            }

            // If there's a reservation but no session row was ever created (student hasn't entered
            // the gate yet at all), build an empty shell so the reservation still has somewhere to
            // live on the page -- entry/scan/exit just stay blank until they actually scan in.
            session ??= new SessionStatusResponse { Status = "left" };

            if (hasReservation)
            {
                session.HasReservation = true;
                session.ReservationDate = reservationInfo!.ReservationDate;
                session.ReservationTime = reservationInfo.ReservationTime;
                session.ReservationSlotNumber = reservationInfo.ReservationSlotNumber;
                session.ReservationAreaName = reservationInfo.ReservationAreaName;
            }

            // "Place" is always the slot the student actually scanned in this session -- the only
            // source of truth for "where am I parked." Walk-ins and reserved students alike show
            // nothing here until they scan, and it can differ from the reserved slot if they parked
            // somewhere else (that's exactly the wrong_slot case). Only relevant while the session is
            // genuinely open -- a closed ('left') session's old entry/scan/exit/violations/assistance
            // data must never leak into the page after the student has left.
            if (session.Status != "left")
            {
                const string scanSql = """
                    SELECT TOP 1
                        sc.scan_time AS ScanTime,
                        s.slot_number AS SlotNumber,
                        a.area_name AS AreaName
                    FROM slot_scans sc
                    JOIN parking_slots s ON s.id = sc.slot_id
                    JOIN parking_areas a ON a.id = s.area_id
                    WHERE sc.session_id = @SessionId AND sc.status IN ('valid', 'late_scan')
                    ORDER BY sc.scan_time DESC
                    """;
                var scannedSlot = await connection.QueryFirstOrDefaultAsync(scanSql, new { session.SessionId });

                if (scannedSlot is not null)
                {
                    session.SlotScanTime = (DateTime)scannedSlot.ScanTime;
                    session.SlotNumber = (string)scannedSlot.SlotNumber;
                    session.AreaName = (string)scannedSlot.AreaName;
                }

                // Violations raised specifically during this session (no_scan, wrong_slot, worker-added, etc).
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

                // Assistance requests have no session_id column, so they're scoped to this session
                // by matching the user and falling inside the real gate entry/exit time window
                // (entry_time/exit_time come only from physical QR scans at the gate, never the website).
                const string assistanceSql = """
                    SELECT
                        ar.id AS Id,
                        su.first_name + ' ' + su.last_name AS StudentName,
                        a.area_name AS AreaName,
                        s.slot_number AS SlotNumber,
                        ar.request_type AS RequestType,
                        ar.status AS Status,
                        wu.first_name + ' ' + wu.last_name AS WorkerName,
                        ar.created_at AS CreatedAt,
                        ar.resolved_at AS ResolvedAt
                    FROM assistance_requests ar
                    JOIN parking_slots s ON s.id = ar.slot_id
                    JOIN parking_areas a ON a.id = s.area_id
                    JOIN users su ON su.id = ar.user_id
                    LEFT JOIN users wu ON wu.id = ar.worker_id
                    WHERE ar.user_id = @UserId
                      AND ar.created_at >= @EntryTime
                      AND (@ExitTime IS NULL OR ar.created_at <= @ExitTime)
                    ORDER BY ar.created_at DESC
                    """;
                session.AssistanceRequests = (await connection.QueryAsync<AssistanceRequestResponse>(
                    assistanceSql, new { UserId = userId, session.EntryTime, session.ExitTime })).ToList();
            }
            else
            {
                // The most recent session row (if any) is already closed -- it's the past, not "now."
                // Wipe its entry/exit/scan timestamps so nothing from a previous visit leaks into
                // today's blank slate. Reservation info above is untouched since it's independent.
                session.SessionId = 0;
                session.EntryTime = null;
                session.ExitTime = null;
                session.SlotScanTime = null;
                session.SlotNumber = null;
                session.AreaName = null;
                session.Violations = new();
                session.AssistanceRequests = new();
            }

            return session;
        }
        public async Task<ParkingSession?> GetOpenSessionByUserIdAsync(int userId)
        {
            const string sql = """
        SELECT TOP 1
            id AS Id, user_id AS UserId, vehicle_id AS VehicleId, reservation_id AS ReservationId,
            slot_id AS SlotId, entry_time AS EntryTime, exit_time AS ExitTime, status AS Status,
            slot_scan_deadline AS SlotScanDeadline
        FROM parking_session
        WHERE user_id = @UserId AND status IN ('entered', 'parked')
        ORDER BY entry_time DESC
        """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<ParkingSession>(sql, new { UserId = userId });
        }

        public async Task<(DateTime ExitTime, int? SlotId, int? AreaId)> ExitAsync(int sessionId)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            const string getSessionSql = "SELECT slot_id AS SlotId, reservation_id AS ReservationId FROM parking_session WHERE id = @SessionId";
            var info = await connection.QueryFirstAsync<ParkingSession>(getSessionSql, new { SessionId = sessionId }, transaction);

            var exitTime = DateTime.Now;
            exitTime = exitTime.AddTicks(-(exitTime.Ticks % TimeSpan.TicksPerSecond));

            const string updateSessionSql = "UPDATE parking_session SET exit_time = @ExitTime, status = 'left' WHERE id = @SessionId";
            await connection.ExecuteAsync(updateSessionSql, new { ExitTime = exitTime, SessionId = sessionId }, transaction);

            int? areaId = null;

            if (info.SlotId is not null)
            {
                const string freeSlotSql = "UPDATE parking_slots SET status = 'available' WHERE id = @SlotId";
                await connection.ExecuteAsync(freeSlotSql, new { SlotId = info.SlotId }, transaction);

                const string getAreaSql = "SELECT area_id FROM parking_slots WHERE id = @SlotId";
                areaId = await connection.ExecuteScalarAsync<int>(getAreaSql, new { SlotId = info.SlotId }, transaction);
            }

            if (info.ReservationId is not null)
            {
                const string completeReservationSql = "UPDATE reservation SET status = 'used' WHERE id = @ReservationId";
                await connection.ExecuteAsync(completeReservationSql, new { ReservationId = info.ReservationId }, transaction);
            }

            transaction.Commit();
            return (exitTime, info.SlotId, areaId);
        }
        public async Task<IEnumerable<ParkingSession>> GetSessionsNeedingScanReminderAsync()
        {
            const string sql = """
        SELECT
            ps.id AS Id, ps.user_id AS UserId, ps.vehicle_id AS VehicleId, ps.reservation_id AS ReservationId,
            ps.slot_id AS SlotId, ps.entry_time AS EntryTime, ps.exit_time AS ExitTime, ps.status AS Status,
            ps.slot_scan_deadline AS SlotScanDeadline
        FROM parking_session ps
        WHERE ps.status = 'entered'
          AND ps.entry_time <= DATEADD(MINUTE, -15, GETDATE())
          AND NOT EXISTS (
              SELECT 1 FROM notification n
              WHERE n.receiver_id = ps.user_id
                AND n.type = 'scan_reminder'
                AND n.created_at >= ps.entry_time
          )
        """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<ParkingSession>(sql);
        }
        public async Task<IEnumerable<ParkingSession>> GetSessionsPastDeadlineAsync()
        {
            const string sql = """
        SELECT
            ps.id AS Id, ps.user_id AS UserId, ps.vehicle_id AS VehicleId, ps.reservation_id AS ReservationId,
            ps.slot_id AS SlotId, ps.entry_time AS EntryTime, ps.exit_time AS ExitTime, ps.status AS Status,
            ps.slot_scan_deadline AS SlotScanDeadline
        FROM parking_session ps
        WHERE ps.status = 'entered'
          AND ps.slot_scan_deadline IS NOT NULL
          AND ps.slot_scan_deadline <= GETDATE()
          AND NOT EXISTS (
              SELECT 1 FROM violations v
              JOIN violation_types vt ON vt.id = v.violation_type_id
              WHERE v.session_id = ps.id AND vt.code = 'no_scan'
          )
        """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<ParkingSession>(sql);
        }
        public async Task<int> GetUserIdBySessionIdAsync(int sessionId)
        {
            const string sql = "SELECT user_id FROM parking_session WHERE id = @SessionId";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql, new { SessionId = sessionId });
        }
        public async Task<IEnumerable<SessionHistoryItem>> GetHistoryByUserIdAsync(int userId)
        {
            const string sessionsSql = """
        SELECT
            ps.id AS SessionId,
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
        LEFT JOIN parking_slots s ON s.id = ps.slot_id
        LEFT JOIN parking_areas a ON a.id = s.area_id
        LEFT JOIN reservation r ON r.id = ps.reservation_id
        LEFT JOIN parking_slots rs ON rs.id = r.slot_id
        LEFT JOIN parking_areas ra ON ra.id = rs.area_id
        LEFT JOIN users u ON u.id = ps.user_id
        WHERE ps.user_id = @UserId
          AND (u.history_cleared_before IS NULL OR ps.entry_time > u.history_cleared_before)
        ORDER BY ps.entry_time DESC
        """;

            using var connection = _connectionFactory.CreateConnection();
            var sessions = (await connection.QueryAsync<SessionHistoryItem>(sessionsSql, new { UserId = userId })).ToList();

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
                ar.status AS Status,
                wu.first_name + ' ' + wu.last_name AS WorkerName,
                ar.created_at AS CreatedAt,
                ar.resolved_at AS ResolvedAt
            FROM assistance_requests ar
            JOIN parking_slots s ON s.id = ar.slot_id
            JOIN parking_areas a ON a.id = s.area_id
            JOIN users su ON su.id = ar.user_id
            LEFT JOIN users wu ON wu.id = ar.worker_id
            WHERE ar.user_id = @UserId
              AND ar.created_at >= @EntryTime
              AND (@ExitTime IS NULL OR ar.created_at <= @ExitTime)
            ORDER BY ar.created_at DESC
            """;
                session.AssistanceRequests = (await connection.QueryAsync<AssistanceRequestResponse>(
                    assistanceSql, new { UserId = userId, session.EntryTime, session.ExitTime })).ToList();
            }

            return sessions;
        }

        public async Task ClearHistoryAsync(int userId)
        {
            const string sql = "UPDATE users SET history_cleared_before = GETDATE() WHERE id = @UserId";
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql, new { UserId = userId });
        }
    }
}