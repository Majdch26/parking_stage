import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Alert } from "reactstrap";
import { Eye, EyeOff } from "lucide-react";
import axiosClient from "../api/axiosClient";
import AuthBrandPanel from "../components/AuthBrandPanel";
import "../style.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axiosClient.post("/Auth/login", {
        Email: email,
        Password: password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("firstName", res.data.firstName);
      localStorage.setItem("userId", res.data.id);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    }
  };

  return (
    <>
      <div className="bg-ambient"></div>
      <div className="login-screen">
        <AuthBrandPanel />

        <div className="login-form-wrap">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="eyebrow">Welcome</div>
            <h1>Login to UPark</h1>
            <div className="sub">Enter your credentials to continue.</div>

            {error && (
              <Alert color="danger" style={{ borderRadius: "var(--r-sm)", fontSize: "12px", marginBottom: "16px" }}>
                {error}
              </Alert>
            )}

            {/* Pas de role-pick ici */}

            <div className="field">
              <label htmlFor="email">University email</label>
              <div className="field-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <path d="m22 7-10 6L2 7" />
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="field-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="field-eye-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Sign In →
            </button>

            <div className="login-foot">
              <span>
                No account? <Link to="/signup" className="link">Create one</Link>
              </span>
              <Link to="/forgot-password" className="admin-link">Forgot password?</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}