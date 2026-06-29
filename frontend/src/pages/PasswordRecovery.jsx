import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, FormGroup, Label, Input, Button, Alert } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AuthBrandPanel from "../components/AuthBrandPanel";
import "../style.css";

export default function PasswordRecovery() {
  const [email, setEmail] = useState("");
  const [storedId, setStoredId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axiosClient.post("/Auth/forgot-password", {
        Email: email,
        StoredId: storedId,
        NewPassword: newPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la réinitialisation.");
    }
  };

  return (
    <>
      <div className="bg-ambient"></div>
      <div className="login-screen">
        <AuthBrandPanel />

        <div className="login-form-wrap">
          <div className="login-form">
            <div className="eyebrow">Account recovery</div>
            <h1>Forgot password</h1>
            <div className="sub">
              Confirm your email and university ID, then choose a new password.
            </div>

            {error && (
              <Alert color="danger" style={{ borderRadius: "var(--r-sm)", fontSize: "12px", marginBottom: "16px" }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert color="success" style={{ borderRadius: "var(--r-sm)", fontSize: "12px", marginBottom: "16px" }}>
                Password reset! Redirecting to login...
              </Alert>
            )}

            {!success && (
              <Form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <div className="field-input">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="3" />
                      <path d="m22 7-10 6L2 7" />
                    </svg>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="storedId">University ID</label>
                  <div className="field-input">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      id="storedId"
                      value={storedId}
                      onChange={(e) => setStoredId(e.target.value)}
                      placeholder="e.g. S1001"
                      required
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="newPassword">New password</label>
                  <div className="field-input">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="11" width="16" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block">
                  Reset password
                </button>
              </Form>
            )}

            <div className="login-foot">
              <Link to="/login" className="link">Back to login</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}