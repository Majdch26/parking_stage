import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Alert } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AuthBrandPanel from "../components/AuthBrandPanel";
import AutocompleteSelect from "../components/AutocompleteSelect";
import "../style.css";

export default function Signup() {
  const [form, setForm] = useState({
    storedId: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    brandId: "",
    modelId: "",
    plateNumber: "",
    year: "",
    color: "",
  });
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axiosClient.get("/Vehicle/brands").then((res) => setBrands(res.data));
  }, []);

  useEffect(() => {
    if (form.brandId) {
      axiosClient
        .get(`/Vehicle/brands/${form.brandId}/models`)
        .then((res) => setModels(res.data));
    } else {
      setModels([]);
    }
    setForm((prev) => ({ ...prev, modelId: "" }));
  }, [form.brandId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.brandId || !form.modelId) {
      setError("Please choose a brand and a model from the suggestions.");
      return;
    }

    try {
      const payload = {
        StoredId: form.storedId,
        FirstName: form.firstName,
        LastName: form.lastName,
        Email: form.email,
        Password: form.password,
        Role: "student", // toujours étudiant
        ModelId: Number(form.modelId),
        PlateNumber: form.plateNumber,
        Year: form.year ? Number(form.year) : null,
        Color: form.color || null,
      };

      await axiosClient.post("/Auth/signup", payload);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration error.");
    }
  };

  return (
    <>
      <div className="bg-ambient"></div>
      <div className="login-screen">
        <AuthBrandPanel />

        <div className="login-form-wrap">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="eyebrow">Create account</div>
            <h1>Sign up to UPark</h1>
            <div className="sub">Fill in your details to join the campus.</div>

            {error && (
              <Alert color="danger" style={{ borderRadius: "var(--r-sm)", fontSize: "12px", marginBottom: "16px" }}>
                {error}
              </Alert>
            )}

            {/* Pas de role-pick ici — tout le monde est étudiant */}

            <div className="field">
              <label htmlFor="storedId">University ID</label>
              <div className="field-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="storedId"
                  name="storedId"
                  value={form.storedId}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="firstName">First Name</label>
              <div className="field-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="lastName">Last Name</label>
              <div className="field-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">University email</label>
              <div className="field-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <path d="m22 7-10 6L2 7" />
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
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
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Champs véhicule (obligatoires) */}
            <div className="field">
              <label>Brand</label>
              <AutocompleteSelect
                options={brands.map((b) => ({ id: b.id, label: b.name }))}
                value={form.brandId}
                onChange={(brandId) => setForm({ ...form, brandId })}
                placeholder="Type to search a brand..."
                emptyMessage="No brand found."
              />
            </div>

            <div className="field">
              <label>Model</label>
              <AutocompleteSelect
                options={models.map((m) => ({ id: m.id, label: `${m.name} (${m.vehicleTypeName})` }))}
                value={form.modelId}
                onChange={(modelId) => setForm({ ...form, modelId })}
                placeholder={form.brandId ? "Type to search a model..." : "Choose a brand first"}
                disabled={!form.brandId}
                emptyMessage="No model found."
              />
            </div>

            <div className="field">
              <label htmlFor="plateNumber">License plate</label>
              <div className="field-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M6 6V4h12v2" />
                </svg>
                <input
                  id="plateNumber"
                  name="plateNumber"
                  value={form.plateNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="year">Year (optional)</label>
              <div className="field-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M3 10h18M8 2v4M16 2v4" />
                </svg>
                <select id="year" name="year" value={form.year} onChange={handleChange}>
                  <option value="">-- Select a year --</option>
                  {Array.from({ length: 35 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="color">Color (optional)</label>
              <div className="field-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <input id="color" name="color" value={form.color} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Sign Up →
            </button>

            <div className="login-foot">
              <span>
                Already have an account? <Link to="/login" className="link">Sign in</Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}