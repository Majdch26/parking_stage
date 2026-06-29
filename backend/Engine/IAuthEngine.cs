using ParkingUniversitySystem.Model;

namespace ParkingUniversitySystem.Engine
{
    /// <summary>
    /// Business logic for signup and login -- validates against the university whitelist,
    /// hashes passwords, generates QR tokens, and issues JWTs.
    /// </summary>
    public interface IAuthEngine
    {
        /// <summary>
        /// Checks StoredId against the university table (must exist and match Role),
        /// rejects duplicate emails/university identities, then creates the account.
        /// Returns an error message instead of throwing, so the controller can give a clear response.
        /// </summary>
        Task<(SignupResponse? Success, string? ErrorMessage)> SignupAsync(SignupRequest request);

        /// <summary>
        /// Validates email/password and returns a signed JWT on success.
        /// Returns null on any failure -- deliberately not revealing whether the
        /// email or the password was wrong, just a generic 401 later in the controller.
        /// </summary>
        Task<LoginResponse?> LoginAsync(LoginRequest request);
        Task<MeResponse?> GetMeAsync(int userId);

        /// <summary>Resets a forgotten password -- proves identity by matching email + university ID
        /// together (no email is sent; there's no mail service configured for this project).</summary>
        Task<(bool Success, string? ErrorMessage)> ResetForgottenPasswordAsync(ForgotPasswordRequest request);
    }
}