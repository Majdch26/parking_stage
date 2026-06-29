import { useState, useEffect } from "react";
import { Container, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from "reactstrap";
import axiosClient from "../api/axiosClient";
import RequireCheckedIn from "./RequireCheckedIn";
import AppLayout from "../components/AppLayout";
import "../upark.css";

function WorkerViolationContent() {
  const [storedId, setStoredId] = useState("");
  const [student, setStudent] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [violationTypes, setViolationTypes] = useState([]);
  const [violationTypeId, setViolationTypeId] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    axiosClient.get("/Violation/types/manual").then((res) => {
      // Ajouter une option "Other" en dur dans la liste des types
      const types = res.data;
      // On pourrait aussi ajouter un type factice avec id = -1 pour "Other"
      setViolationTypes(types);
    });
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setStudent(null);
    setSessionId(null);
    setViolationTypeId("");
    setCustomDescription("");
    try {
      const res = await axiosClient.get(`/User/search?storedId=${storedId}`);
      setStudent(res.data);
      try {
        const sessionRes = await axiosClient.get(`/Session/active/${res.data.id}`);
        setSessionId(sessionRes.data.sessionId);
      } catch {
        setSessionId(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Student not found.");
    }
  };

  const handleAddViolation = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Si le type sélectionné est "other" (id = -1), il faut une description
    const isOther = violationTypeId === "other";
    if (isOther && !customDescription.trim()) {
      setError("Please provide a description for the custom violation.");
      return;
    }

    try {
      const payload = {
        StudentId: student.id,
        SessionId: sessionId,
      };

      if (isOther) {
        // Envoyer un type "other" avec une description personnalisée
        payload.ViolationTypeId = null; // ou un ID spécial si le backend en a un
        payload.CustomDescription = customDescription.trim();
        // Vous devrez adapter le backend pour accepter CustomDescription
      } else {
        payload.ViolationTypeId = Number(violationTypeId);
      }

      const res = await axiosClient.post("/Violation", payload);
      setSuccess(
        `Violation added (+${res.data.points} pts). Total: ${res.data.pointsAtTime}${
          res.data.justBanned ? " — Student now BLOCKED" : ""
        }`
      );
      setStudent(null);
      setSessionId(null);
      setStoredId("");
      setViolationTypeId("");
      setCustomDescription("");
    } catch (err) {
      setError(err.response?.data?.message || "Error while adding violation.");
    }
  };

  return (
    <Container style={{ maxWidth: "500px", paddingTop: "24px", paddingBottom: "40px" }}>
      <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#02457A" }}>Add a violation</h3>

      {error && <Alert color="danger">{error}</Alert>}
      {success && <Alert color="success">{success}</Alert>}

      <Card className="mb-4 upk-card">
        <CardBody>
          <Form onSubmit={handleSearch}>
            <FormGroup>
              <Label for="storedId">Student university ID</Label>
              <Input
                id="storedId"
                value={storedId}
                onChange={(e) => setStoredId(e.target.value)}
                placeholder="e.g. S1001"
                required
              />
            </FormGroup>
            <Button color="secondary" type="submit" style={{ background: "#6B7280", border: "none" }}>Search</Button>
          </Form>
        </CardBody>
      </Card>

      {student && (
        <Card className="upk-card">
          <CardBody>
            <p><strong>{student.firstName} {student.lastName}</strong> — {student.points} current points</p>
            <p style={{ fontSize: "0.85rem", color: sessionId ? "#198754" : "#dc3545" }}>
              {sessionId
                ? `Active session detected (#${sessionId}) — the violation will be linked to this session.`
                : "No active session found — the violation will be added without a session link."}
            </p>
            <Form onSubmit={handleAddViolation}>
              <FormGroup>
                <Label for="violationTypeId">Violation type</Label>
                <Input
                  type="select"
                  id="violationTypeId"
                  value={violationTypeId}
                  onChange={(e) => {
                    setViolationTypeId(e.target.value);
                    if (e.target.value !== "other") setCustomDescription("");
                  }}
                  required
                >
                  <option value="">-- Choose --</option>
                  {violationTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.description} (+{t.points} pts)
                    </option>
                  ))}
                  <option value="other">Other (custom description)</option>
                </Input>
              </FormGroup>

              {violationTypeId === "other" && (
                <FormGroup>
                  <Label for="customDescription">Describe the violation</Label>
                  <Input
                    type="textarea"
                    id="customDescription"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Explain the violation in detail..."
                    rows={3}
                    required
                  />
                </FormGroup>
              )}

              <Button className="upk-btn upk-btn-primary" type="submit" block style={{ width: "100%" }}>
                Confirm violation
              </Button>
            </Form>
          </CardBody>
        </Card>
      )}
    </Container>
  );
}

export default function WorkerViolation() {
  return (
    <AppLayout>
      <RequireCheckedIn>
        <WorkerViolationContent />
      </RequireCheckedIn>
    </AppLayout>
  );
}