using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using ParkingUniversitySystem.Repository;

namespace ParkingUniversitySystem.Engine
{
    public class ChatEngine : IChatEngine
    {
        private readonly IUserRepository _userRepository;
        private readonly IVehicleRepository _vehicleRepository;
        private readonly IParkingSessionRepository _sessionRepository;
        private readonly IReservationRepository _reservationRepository;
        private readonly IViolationRepository _violationRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;

        public ChatEngine(
            IUserRepository userRepository,
            IVehicleRepository vehicleRepository,
            IParkingSessionRepository sessionRepository,
            IReservationRepository reservationRepository,
            IViolationRepository violationRepository,
            INotificationRepository notificationRepository,
            HttpClient httpClient,
            IConfiguration configuration)
        {
            _userRepository = userRepository;
            _vehicleRepository = vehicleRepository;
            _sessionRepository = sessionRepository;
            _reservationRepository = reservationRepository;
            _violationRepository = violationRepository;
            _notificationRepository = notificationRepository;
            _httpClient = httpClient;
            _apiKey = configuration["Groq:ApiKey"] ?? string.Empty;
            _model = configuration["Groq:Model"] ?? "llama-3.3-70b-versatile";
        }

        public async Task<string> AskAsync(int userId, string role, string message)
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                return "The assistant isn't configured yet (missing API key) -- ask an admin to set Groq:ApiKey in appsettings.json.";
            }

            var context = await BuildContextAsync(userId, role);

            const string systemPrompt = """
                You are the help assistant embedded in a university parking website. You answer questions
                using ONLY the rules and the live user data given to you below -- never invent rules,
                point values, or data that isn't provided. If something isn't covered, say so plainly and
                suggest the user open the Assistance page to reach a worker.

                Keep answers short (2-4 sentences), friendly, and in the same language the user wrote in
                (French or English). Refer to the user's own data naturally when relevant (e.g. their
                current points, their active reservation) instead of generic advice.

                === APP RULES ===
                - Violation points: bad parking +10, very bad parking +20, no slot scan +20, wrong slot +20, accident +20.
                - Reaching 100+ points bans the account until an admin unbans it.
                - After gate entry, students have 40 minutes to scan their parking slot (reminder at 25 minutes).
                - Reservation no-show grace period = 1/4 of the reservation's own duration, counted from its
                  scheduled start time. If the student hasn't entered by then, the reservation auto-expires,
                  the slot frees up, and they're notified.
                - When a reservation's scheduled end time passes, the student is notified and the slot frees up.
                - Waiting list priority: earliest requested time first, then earliest join time as tiebreaker.
                - Assistance request types: parking_help, accident, security_issue, car_problem, other.
                - Vehicle registration: pick brand + model, the vehicle type (car/SUV/motorcycle) is set automatically.
                - Workers check in/out of zones by scanning that zone's QR code; one worker per zone at a time;
                  shifts alarm after 7 hours.
                - Signup requires the person's university ID to already exist in the university's own records.
                """;

            var userPrompt = $"""
                === CURRENT USER'S LIVE DATA ===
                {context}

                === USER'S QUESTION ===
                {message}
                """;

            // Grok (xAI) exposes an OpenAI-compatible Chat Completions endpoint --
            // different shape from Anthropic's Messages API: messages array includes
            // the system prompt as its own message, auth is a plain Bearer token,
            // and the reply lives at choices[0].message.content.
            var payload = new
            {
                model = _model,
                max_tokens = 400,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                }
            };

            // Groq exposes an OpenAI-compatible Chat Completions endpoint at api.groq.com
            // (NOT api.x.ai -- that's xAI/Grok, a different company with a similar name).
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.SendAsync(request);
                var body = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return "Sorry, I couldn't reach the assistant service right now. Please try again in a moment.";
                }

                using var doc = JsonDocument.Parse(body);
                var reply = doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                return reply ?? "Sorry, I didn't get a usable reply.";
            }
            catch (Exception)
            {
                return "Sorry, something went wrong while reaching the assistant service.";
            }
        }

        private async Task<string> BuildContextAsync(int userId, string role)
        {
            var sb = new StringBuilder();

            var user = await _userRepository.GetByIdAsync(userId);
            if (user is not null)
            {
                sb.AppendLine($"- Name: {user.FirstName} {user.LastName}, Role: {user.Role}, Status: {user.Status}, Violation points: {user.Points}/100");
            }

            if (role == "student")
            {
                var vehicles = await _vehicleRepository.GetByUserIdAsync(userId);
                var vehicleList = vehicles.Select(v => $"{v.BrandName} {v.ModelName} ({v.PlateNumber}){(v.IsPrimary ? " [primary]" : "")}");
                sb.AppendLine($"- Vehicles: {(vehicleList.Any() ? string.Join(", ", vehicleList) : "none registered")}");

                var session = await _sessionRepository.GetMostRecentSessionStatusByUserIdAsync(userId);
                sb.AppendLine(session is not null
                    ? $"- Most recent parking session: status={session.Status}, entry={session.EntryTime}, slotScanTime={session.SlotScanTime}, slot={session.SlotNumber}, area={session.AreaName}"
                    : "- No parking session on record.");

                var reservations = await _reservationRepository.GetByUserIdAsync(userId);
                var active = reservations.FirstOrDefault(r => r.Status == "pending" || r.Status == "confirmed");
                sb.AppendLine(active is not null
                    ? $"- Active reservation: slot {active.SlotNumber} in {active.AreaName}, {active.ReservationDate:yyyy-MM-dd} from {active.ScheduledEntryTime} to {active.ScheduledEndTime}, status={active.Status}"
                    : "- No active reservation right now.");

                var violations = await _violationRepository.GetByStudentIdAsync(userId);
                var recentViolations = violations.Take(3).Select(v => $"{v.ViolationTypeCode} ({v.PointsAtTime} pts, {v.CreatedAt:yyyy-MM-dd})");
                sb.AppendLine($"- Recent violations: {(recentViolations.Any() ? string.Join("; ", recentViolations) : "none")}");
            }

            var notifications = await _notificationRepository.GetByUserIdAsync(userId);
            var unread = notifications.Count(n => !n.IsRead);
            sb.AppendLine($"- Unread notifications: {unread}");

            return sb.ToString();
        }
    }
}