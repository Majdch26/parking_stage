import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, FormGroup, Label, Input, Button, Alert } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AuthBrandPanel from "../components/AuthBrandPanel";
import "../upark.css";

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
    <div className="auth-page">
      <AuthBrandPanel />
      <div className="auth-form-side">
        <div className="auth-card">
          <h2>Mot de passe oublié</h2>
          <p className="auth-subtitle">
            Entre ton email et ton ID universitaire pour confirmer que c'est bien toi, puis choisis un nouveau mot de passe.
          </p>

          {error && <Alert color="danger">{error}</Alert>}
          {success && <Alert color="success">Mot de passe réinitialisé ! Redirection vers la connexion...</Alert>}

          {!success && (
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label for="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label for="storedId">ID universitaire</Label>
                <Input
                  id="storedId"
                  value={storedId}
                  onChange={(e) => setStoredId(e.target.value)}
                  placeholder="ex: S1001"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label for="newPassword">Nouveau mot de passe</Label>
                <Input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </FormGroup>

              <Button className="auth-submit-btn" type="submit" block>
                Réinitialiser le mot de passe
              </Button>
            </Form>
          )}

          <p className="auth-switch-link">
            <Link to="/login">Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}