namespace ParkingUniversitySystem.Engine
{
    public interface IChatEngine
    {
        /// <summary>Answers a free-form question using this user's own live data (points, reservation,
        /// session, vehicles, recent violations) as context, sent to a real LLM for a natural-language reply.</summary>
        Task<string> AskAsync(int userId, string role, string message);
    }
}