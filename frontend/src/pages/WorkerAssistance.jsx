import { useEffect, useState } from "react";
import { Container, Card, CardBody, Button, Badge, Alert } from "reactstrap";
import axiosClient from "../api/axiosClient";
import RequireCheckedIn from "./RequireCheckedIn";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const HELP_LABELS = {
  parking_help: "Parking help",
  accident: "Accident",
  security_issue: "Security issue",
  car_problem: "Car problem",
  other: "Other",
};

function WorkerAssistanceContent() {
  const [pending, setPending] = useState(null);
  const [accepted, setAccepted] = useState(null);
  const [error, setError] = useState("");

  const loadAll = () => {
    axiosClient.get("/Assistance/pending").then((res) => setPending(res.data)).catch(() => setPending([]));
    axiosClient.get("/Assistance/my-accepted").then((res) => setAccepted(res.data)).catch(() => setAccepted([]));
  };

  useEffect(() => { loadAll(); }, []);

  const handleAccept = async (id) => {
    setError("");
    try {
      await axiosClient.post(`/Assistance/${id}/accept`);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Error while accepting.");
    }
  };

  const handleResolve = async (id) => {
    setError("");
    try {
      await axiosClient.post(`/Assistance/${id}/resolve`);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Error while resolving.");
    }
  };

  const fmt = (d) =>
    new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <Container style={{ maxWidth: "600px", paddingTop: "24px", paddingBottom: "40px" }}>
      <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#02457A" }}>
        Assistance requests
      </h3>
      <p style={{ color: "#6B7280", marginBottom: "20px" }}>
        Pending requests in your zone (or everywhere if you are not checked-in).
      </p>

      {error && <Alert color="danger">{error}</Alert>}

      <h5 style={{ color: "#02457A", fontFamily: "Poppins, sans-serif" }}>Pending</h5>
      {pending === null ? (
        <p style={{ color: "#6B7280" }}>Loading...</p>
      ) : pending.length === 0 ? (
        <p style={{ color: "#6B7280", marginBottom: "24px" }}>No pending requests.</p>
      ) : (
        pending.map((r) => (
          <Card key={r.id} className="mb-2 upk-card">
            <CardBody className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{HELP_LABELS[r.requestType] || r.requestType}</strong>
                <div style={{ fontSize: "0.85rem", color: "#6B7280" }}>
                  {r.studentName} · {r.areaName} — {r.slotNumber} · {fmt(r.createdAt)}
                  {r.details && <div>{r.details}</div>}
                </div>
              </div>
              <Button color="primary" size="sm" onClick={() => handleAccept(r.id)} style={{ background: "#02457A", border: "none" }}>
                Accept
              </Button>
            </CardBody>
          </Card>
        ))
      )}

      <h5 style={{ color: "#02457A", fontFamily: "Poppins, sans-serif", marginTop: "24px" }}>
        My ongoing requests
      </h5>
      {accepted === null ? (
        <p style={{ color: "#6B7280" }}>Loading...</p>
      ) : accepted.length === 0 ? (
        <p style={{ color: "#6B7280" }}>No accepted requests at the moment.</p>
      ) : (
        accepted.map((r) => (
          <Card key={r.id} className="mb-2 upk-card">
            <CardBody className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{HELP_LABELS[r.requestType] || r.requestType}</strong>
                <div style={{ fontSize: "0.85rem", color: "#6B7280" }}>
                  {r.studentName} · {r.areaName} — {r.slotNumber} · {fmt(r.createdAt)}
                  {r.details && <div>{r.details}</div>}
                </div>
              </div>
              {r.status === "in_progress" ? (
                <Button color="success" size="sm" onClick={() => handleResolve(r.id)} style={{ background: "#16a34a", border: "none" }}>
                  Resolve
                </Button>
              ) : (
                <Badge color="success">Resolved</Badge>
              )}
            </CardBody>
          </Card>
        ))
      )}
    </Container>
  );
}

export default function WorkerAssistance() {
  return (
    <AppLayout>
      <RequireCheckedIn>
        <WorkerAssistanceContent />
      </RequireCheckedIn>
    </AppLayout>
  );
}