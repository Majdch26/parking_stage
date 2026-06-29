using Dapper;
using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.DAL
{
    public class ReservationRepository : IReservationRepository
    {
        private readonly ISqlConnectionFactory _connectionFactory;

        public ReservationRepository(ISqlConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<ReservationResponse?> CreateReservationAsync(
            int userId, int vehicleId, int slotId, DateTime reservationDate,
            TimeSpan scheduledEntryTime, TimeSpan scheduledEndTime)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            const string slotSql = """
                SELECT id AS Id, area_id AS AreaId, slot_number AS SlotNumber, status AS Status, slot_token AS SlotToken
                FROM parking_slots
                WHERE id = @SlotId
                """;
            var slot = await connection.QueryFirstOrDefaultAsync<ParkingSlot>(slotSql, new { SlotId = slotId }, transaction);

            if (slot is null || slot.Status == "maintenance")
            {
                transaction.Rollback();
                return null; // Doesn't exist, or out of service entirely.
            }

            // Overlap check: any active reservation on this exact slot/date whose window
            // intersects [Start, End)? Classic interval-overlap test.
            const string overlapSql = """
                SELECT COUNT(1) FROM reservation
                WHERE slot_id = @SlotId
                  AND reservation_date = @ReservationDate
                  AND status IN ('pending', 'confirmed')
                  AND scheduled_entry_time < @End
                  AND scheduled_end_time > @Start
                """;
            var overlapCount = await connection.ExecuteScalarAsync<int>(overlapSql, new
            {
                SlotId = slotId,
                ReservationDate = reservationDate.Date,
                Start = scheduledEntryTime,
                End = scheduledEndTime
            }, transaction);

            if (overlapCount > 0)
            {
                transaction.Rollback();
                return null; // Someone already holds this slot during (part of) that window.
            }

            const string insertSql = """
                INSERT INTO reservation (user_id, vehicle_id, slot_id, reservation_date, scheduled_entry_time, scheduled_end_time, status)
                VALUES (@UserId, @VehicleId, @SlotId, @ReservationDate, @ScheduledEntryTime, @ScheduledEndTime, 'confirmed');
                SELECT CAST(SCOPE_IDENTITY() AS INT);
                """;
            var reservationId = await connection.ExecuteScalarAsync<int>(insertSql, new
            {
                UserId = userId,
                VehicleId = vehicleId,
                SlotId = slot.Id,
                ReservationDate = reservationDate.Date,
                ScheduledEntryTime = scheduledEntryTime,
                ScheduledEndTime = scheduledEndTime
            }, transaction);

            // Mark the slot as having at least one active reservation -- only matters for the
            // very first one; if it's already 'reserved' from another window, this is a no-op.
            if (slot.Status == "available")
            {
                const string markReservedSql = "UPDATE parking_slots SET status = 'reserved' WHERE id = @SlotId";
                await connection.ExecuteAsync(markReservedSql, new { SlotId = slot.Id }, transaction);
            }

            transaction.Commit();

            const string areaNameSql = "SELECT area_name FROM parking_areas WHERE id = @AreaId";
            var areaName = await connection.ExecuteScalarAsync<string>(areaNameSql, new { AreaId = slot.AreaId });

            return new ReservationResponse
            {
                Id = reservationId,
                AreaName = areaName ?? string.Empty,
                SlotNumber = slot.SlotNumber,
                ReservationDate = reservationDate,
                ScheduledEntryTime = scheduledEntryTime,
                ScheduledEndTime = scheduledEndTime,
                Status = "confirmed"
            };
        }

        public async Task<bool> HasAnyActiveReservationAsync(int userId)
        {
            const string sql = """
            SELECT COUNT(1) FROM reservation
            WHERE user_id = @UserId
            AND status IN ('pending', 'confirmed')
            """;

            using var connection = _connectionFactory.CreateConnection();
            var count = await connection.ExecuteScalarAsync<int>(sql, new { UserId = userId });
            return count > 0;
        }

        public async Task<(bool Cancelled, int? FreedSlotId)> CancelReservationAsync(int reservationId, int userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            const string cancelSql = """
            UPDATE reservation
            SET status = 'cancelled'
            OUTPUT inserted.slot_id
            WHERE id = @ReservationId AND user_id = @UserId AND status IN ('pending', 'confirmed');
            """;

            var slotId = await connection.QueryFirstOrDefaultAsync<int?>(
                cancelSql, new { ReservationId = reservationId, UserId = userId }, transaction);

            if (slotId is null)
            {
                transaction.Rollback();
                return (false, null);
            }

            var freedSlotId = await FreeSlotIfNoOtherActiveReservationsAsync(connection, transaction, slotId.Value);

            transaction.Commit();
            return (true, freedSlotId);
        }

        public async Task<IEnumerable<ReservationResponse>> GetByUserIdAsync(int userId)
        {
            const string sql = """
           SELECT
            r.id                  AS Id,
            a.area_name           AS AreaName,
            s.slot_number         AS SlotNumber,
            r.reservation_date     AS ReservationDate,
            r.scheduled_entry_time AS ScheduledEntryTime,
            r.scheduled_end_time   AS ScheduledEndTime,
            r.status               AS Status
          FROM reservation r
          JOIN parking_slots s ON s.id = r.slot_id
          JOIN parking_areas a ON a.id = s.area_id
          WHERE r.user_id = @UserId
          ORDER BY r.reservation_date DESC, r.scheduled_entry_time DESC
          """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<ReservationResponse>(sql, new { UserId = userId });
        }

        public async Task<bool> UpdateReservationTimeAsync(int reservationId, int userId, DateTime reservationDate, TimeSpan scheduledEntryTime, TimeSpan scheduledEndTime)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            const string getSlotSql = """
                SELECT slot_id FROM reservation
                WHERE id = @ReservationId AND user_id = @UserId AND status IN ('pending', 'confirmed')
                """;
            var slotId = await connection.QueryFirstOrDefaultAsync<int?>(
                getSlotSql, new { ReservationId = reservationId, UserId = userId }, transaction);

            if (slotId is null)
            {
                transaction.Rollback();
                return false;
            }

            // Same overlap check as creating, but excluding this reservation's own existing row.
            const string overlapSql = """
                SELECT COUNT(1) FROM reservation
                WHERE slot_id = @SlotId
                  AND reservation_date = @ReservationDate
                  AND status IN ('pending', 'confirmed')
                  AND id <> @ReservationId
                  AND scheduled_entry_time < @End
                  AND scheduled_end_time > @Start
                """;
            var overlapCount = await connection.ExecuteScalarAsync<int>(overlapSql, new
            {
                SlotId = slotId,
                ReservationDate = reservationDate.Date,
                Start = scheduledEntryTime,
                End = scheduledEndTime,
                ReservationId = reservationId
            }, transaction);

            if (overlapCount > 0)
            {
                transaction.Rollback();
                return false;
            }

            const string updateSql = """
              UPDATE reservation
              SET reservation_date = @ReservationDate, scheduled_entry_time = @ScheduledEntryTime, scheduled_end_time = @ScheduledEndTime
              WHERE id = @ReservationId AND user_id = @UserId
              """;
            var rowsAffected = await connection.ExecuteAsync(updateSql, new
            {
                ReservationId = reservationId,
                UserId = userId,
                ReservationDate = reservationDate.Date,
                ScheduledEntryTime = scheduledEntryTime,
                ScheduledEndTime = scheduledEndTime
            }, transaction);

            transaction.Commit();
            return rowsAffected > 0;
        }

        public async Task<int> GetAreaIdBySlotIdAsync(int slotId)
        {
            const string sql = "SELECT area_id FROM parking_slots WHERE id = @SlotId";
            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql, new { SlotId = slotId });
        }

        public async Task<IEnumerable<Reservation>> GetExpiredReservationsAsync()
        {
            const string sql = """
          SELECT r.id AS Id, r.user_id AS UserId, r.vehicle_id AS VehicleId, r.slot_id AS SlotId,
               r.reservation_date AS ReservationDate, r.scheduled_entry_time AS ScheduledEntryTime,
               r.scheduled_end_time AS ScheduledEndTime, r.status AS Status
          FROM reservation r
          WHERE r.status = 'confirmed'
          -- No-show grace period = 1/4 of the reservation's own duration
          -- (e.g. a 1h booking expires after 15min, a 30min booking after 7.5min/450s).
          AND DATEADD(
                SECOND,
                DATEDIFF(SECOND, r.scheduled_entry_time, r.scheduled_end_time) / 4,
                CAST(r.reservation_date AS DATETIME) + CAST(r.scheduled_entry_time AS DATETIME)
              ) <= GETDATE()
          AND NOT EXISTS (SELECT 1 FROM parking_session ps WHERE ps.reservation_id = r.id)
          """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<Reservation>(sql);
        }

        public async Task<(bool Expired, int? FreedSlotId)> ExpireAsync(int reservationId)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            const string expireSql = """
           UPDATE reservation
           SET status = 'expired'
           OUTPUT inserted.slot_id
           WHERE id = @ReservationId AND status = 'confirmed';
           """;

            var slotId = await connection.QueryFirstOrDefaultAsync<int?>(expireSql, new { ReservationId = reservationId }, transaction);

            if (slotId is null)
            {
                transaction.Rollback();
                return (false, null);
            }

            var freedSlotId = await FreeSlotIfNoOtherActiveReservationsAsync(connection, transaction, slotId.Value);

            transaction.Commit();
            return (true, freedSlotId);
        }

        public async Task<IEnumerable<Reservation>> GetEndedReservationsNeedingNotificationAsync()
        {
            const string sql = """
              SELECT r.id AS Id, r.user_id AS UserId, r.vehicle_id AS VehicleId, r.slot_id AS SlotId,
                   r.reservation_date AS ReservationDate, r.scheduled_entry_time AS ScheduledEntryTime,
                   r.scheduled_end_time AS ScheduledEndTime, r.status AS Status
              FROM reservation r
              WHERE r.status IN ('confirmed', 'used')
              AND r.ended_notified_at IS NULL
              AND DATEADD(MINUTE, 0, CAST(r.reservation_date AS DATETIME) + CAST(r.scheduled_end_time AS DATETIME)) <= GETDATE()
              """;

            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<Reservation>(sql);
        }

        // Called once per reservation when its scheduled end time has passed: marks it
        // notified (so the background job won't fire again) and frees its slot, same rule
        // as cancel/expire -- only actually free if no OTHER active window still holds it.
        public async Task<int?> CompleteEndedReservationAsync(int reservationId)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            const string markSql = """
               UPDATE reservation
               SET ended_notified_at = GETDATE()
               OUTPUT inserted.slot_id
               WHERE id = @ReservationId AND ended_notified_at IS NULL;
               """;

            var slotId = await connection.QueryFirstOrDefaultAsync<int?>(markSql, new { ReservationId = reservationId }, transaction);

            if (slotId is null)
            {
                transaction.Rollback();
                return null;
            }

            var freedSlotId = await FreeSlotIfNoOtherActiveReservationsAsync(connection, transaction, slotId.Value);

            transaction.Commit();
            return freedSlotId;
        }

        public async Task<IEnumerable<ReservationWindowResponse>> GetActiveWindowsForSlotAsync(int slotId, DateTime date)
        {
            const string sql = """
                SELECT scheduled_entry_time AS StartTime, scheduled_end_time AS EndTime
                FROM reservation
                WHERE slot_id = @SlotId AND reservation_date = @Date AND status IN ('pending', 'confirmed')
                ORDER BY scheduled_entry_time
                """;
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<ReservationWindowResponse>(sql, new { SlotId = slotId, Date = date.Date });
        }

        // Shared by cancel and expire: a slot only goes back to 'available' once NO other active
        // reservation remains on it -- otherwise another time window is still holding it.
        private static async Task<int?> FreeSlotIfNoOtherActiveReservationsAsync(
            System.Data.IDbConnection connection, System.Data.IDbTransaction transaction, int slotId)
        {
            const string remainingSql = """
                SELECT COUNT(1) FROM reservation
                WHERE slot_id = @SlotId AND status IN ('pending', 'confirmed')
                """;
            var remaining = await connection.ExecuteScalarAsync<int>(remainingSql, new { SlotId = slotId }, transaction);

            if (remaining > 0)
            {
                return null; // Still held by another window -- not actually free.
            }

            const string freeSlotSql = "UPDATE parking_slots SET status = 'available' WHERE id = @SlotId";
            await connection.ExecuteAsync(freeSlotSql, new { SlotId = slotId }, transaction);
            return slotId;
        }
    }
}