using ParkingUniversitySystem.Model;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.Engine
{
    public class ViolationEngine : IViolationEngine
    {
        private readonly IViolationRepository _violationRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationRepository _notificationRepository;

        public ViolationEngine(
            IViolationRepository violationRepository,
            IUserRepository userRepository,
            INotificationRepository notificationRepository)
        {
            _violationRepository = violationRepository;
            _userRepository = userRepository;
            _notificationRepository = notificationRepository;
        }

        public async Task<(ViolationResponse? Success, string? ErrorMessage)> AddViolationAsync(int workerId, AddViolationRequest request)
        {
            var student = await _userRepository.GetByIdAsync(request.StudentId);
            if (student is null || student.Role != UserRoles.Student)
            {
                return (null, "Student not found.");
            }

            var violationType = await _violationRepository.GetViolationTypeByIdAsync(request.ViolationTypeId);
            if (violationType is null)
            {
                return (null, "Invalid violation type.");
            }

            var (newTotal, justBanned, violationId) = await _violationRepository.AddViolationAsync(
                request.StudentId, workerId, request.ViolationTypeId, request.SessionId);

            // Tell the student a violation just got added to their profile.
            await _notificationRepository.CreateAsync(
                request.StudentId, workerId, "violation",
                $"You received a {violationType.Code} violation ({violationType.Points} points). Your total is now {newTotal}.");

            if (justBanned)
            {
                await _notificationRepository.CreateAsync(
                    request.StudentId, null, "violation",
                    "Your account has reached 100 points and has been banned from entering the parking lot.");
            }

            return (new ViolationResponse
            {
                Id = violationId,
                StudentName = $"{student.FirstName} {student.LastName}",
                ViolationTypeCode = violationType.Code,
                Points = violationType.Points,
                PointsAtTime = newTotal,
                JustBanned = justBanned,
                CreatedAt = DateTime.Now
            }, null);
        }

        public async Task<(MultipleViolationsResponse? Success, string? ErrorMessage)> AddMultipleViolationsAsync(int workerId, AddMultipleViolationsRequest request)
        {
            var student = await _userRepository.GetByIdAsync(request.StudentId);
            if (student is null || student.Role != UserRoles.Student)
            {
                return (null, "Student not found.");
            }

            var results = new List<ViolationResponse>();
            int latestTotal = student.Points;
            bool isBanned = student.Status == "blocked";
            bool justBannedNow = false;

            foreach (var violationTypeId in request.ViolationTypeIds)
            {
                var violationType = await _violationRepository.GetViolationTypeByIdAsync(violationTypeId);
                if (violationType is null)
                {
                    return (null, $"Invalid violation type id: {violationTypeId}.");
                }

                var (newTotal, justBanned, violationId) = await _violationRepository.AddViolationAsync(
                    request.StudentId, workerId, violationTypeId, request.SessionId);

                latestTotal = newTotal;
                if (justBanned)
                {
                    isBanned = true;
                    justBannedNow = true;
                }

                await _notificationRepository.CreateAsync(
                    request.StudentId, workerId, "violation",
                    $"You received a {violationType.Code} violation ({violationType.Points} points). Your total is now {newTotal}.");

                results.Add(new ViolationResponse
                {
                    Id = violationId,
                    StudentName = $"{student.FirstName} {student.LastName}",
                    ViolationTypeCode = violationType.Code,
                    Points = violationType.Points,
                    PointsAtTime = newTotal,
                    JustBanned = justBanned,
                    CreatedAt = DateTime.Now
                });
            }

            if (justBannedNow)
            {
                await _notificationRepository.CreateAsync(
                    request.StudentId, null, "violation",
                    "Your account has reached 100 points and has been banned from entering the parking lot.");
            }

            return (new MultipleViolationsResponse { Violations = results, FinalPointsTotal = latestTotal, IsBanned = isBanned }, null);
        }

        public Task<IEnumerable<ViolationResponse>> GetMyViolationsAsync(int studentId) =>
            _violationRepository.GetByStudentIdAsync(studentId);
    }
}