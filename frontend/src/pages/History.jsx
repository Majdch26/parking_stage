import { useEffect, useState } from "react";
import { Container, Card, CardBody, Badge, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

export default function History() {
  const [sessions, setSessions] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    axiosClient
      .get("/Session/history")
      .then((res) => setSessions(res.data))
      .catch(() => setSessions([]));
  };

  useEffect(() => { load(); }, []);

  const fmtDateTime = (d) =>
    d
      ? new Date(d).toLocaleString("en-US", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const fmtDateLabel = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const statusLabel = {
    entered: "Entered, slot not scanned",
    parked: "Parked",
    left: "Left",
  };

  const statusColor = {
    entered: "warning",
    parked: "success",
    left: "secondary",
  };

  const groups = {};
  (sessions || []).forEach((s) => {
    const dayKey = new Date(s.entryTime).toLocaleDateString("en-US");
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(s);
  });
  const sortedDayKeys = Object.keys(groups).sort((a, b) => {
    const [d1, m1, y1] = a.split("/").map(Number);
    const [d2, m2, y2] = b.split("/").map(Number);
    return new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1);
  });

  const handleClearHistory = () => {
    setConfirmOpen(false);
    axiosClient
      .post("/Session/history/clear")
      .then(() => {
        setSessions([]);
        setSelectedDate(null);
      })
      .catch((err) => setError(err.response?.data?.message || "Clear failed."));
  };

  if (sessions === null) {
    return (
      <AppLayout>
        <Container style={{ paddingTop: "24px" }}>
          <p style={{ color: "#4a5568" }}>Loading...</p>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container style={{ maxWidth: "700px", paddingTop: "24px", paddingBottom: "40px" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#02457A", margin: 0 }}>
            History
          </h3>
          {sessions.length > 0 && (
            <Button color="danger" outline size="sm" onClick={() => setConfirmOpen(true)}>Clear history</Button>
          )}
        </div>
        <p style={{ color: "#4a5568", marginBottom: "24px" }}>
          All your past sessions, grouped by date. Click a date to see details.
        </p>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {sessions.length === 0 ? (
          <Card className="upk-card">
            <CardBody>
              <p style={{ color: "#4a5568", margin: 0 }}>No history yet.</p>
            </CardBody>
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px" }}>
            {sortedDayKeys.map((dayKey) => (
              <Card
                key={dayKey}
                onClick={() => setSelectedDate(dayKey)}
                className="upk-card"
                style={{
                  cursor: "pointer",
                  border: selectedDate === dayKey ? "2px solid #02457A" : "1px solid #e3e7f0",
                }}
              >
                <CardBody className="text-center p-3">
                  <strong style={{ color: "#02457A", fontFamily: "'Space Grotesk', sans-serif" }}>{dayKey}</strong>
                  <div style={{ fontSize: "0.8rem", color: "#4a5568", marginTop: "4px" }}>
                    {groups[dayKey].length} session{groups[dayKey].length > 1 ? "s" : ""}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {selectedDate && (
          <div className="mt-4">
            <h5 style={{ color: "#02457A", fontFamily: "'Space Grotesk', sans-serif", textTransform: "capitalize" }}>
              {fmtDateLabel(groups[selectedDate][0].entryTime)}
            </h5>

            {groups[selectedDate].map((s) => (
              <Card key={s.sessionId} className="mb-3 upk-card">
                <CardBody>
                  <Badge color={statusColor[s.status]} className="mb-2">
                    {statusLabel[s.status]}
                  </Badge>

                  <p className="mb-1"><strong>Entry scanned:</strong> {fmtDateTime(s.entryTime)}</p>
                  <p className="mb-1"><strong>Slot scanned:</strong> {s.slotNumber ? `${s.areaName} — ${s.slotNumber}` : "—"}</p>
                  <p className="mb-1"><strong>Exit scanned:</strong> {fmtDateTime(s.exitTime)}</p>
                  <p className="mb-2">
                    <strong>With reservation:</strong> {s.hasReservation ? "Yes" : "No"}
                    {s.hasReservation && (
                      <span style={{ color: "#4a5568" }}>
                        {" "}— {s.reservationAreaName} {s.reservationSlotNumber} at {s.reservationTime}
                      </span>
                    )}
                  </p>

                  <div className="mt-3">
                    <strong style={{ fontSize: "0.9rem" }}>Violations</strong>
                    {s.violations.length === 0 ? (
                      <p style={{ color: "#4a5568", fontSize: "0.85rem" }} className="mb-2">None.</p>
                    ) : (
                      s.violations.map((v) => (
                        <div key={v.id} className="d-flex justify-content-between py-1" style={{ fontSize: "0.85rem" }}>
                          <span style={{ textTransform: "capitalize" }}>{v.violationTypeCode.replace(/_/g, " ")}</span>
                          <Badge color="danger">+{v.points} pts</Badge>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-2">
                    <strong style={{ fontSize: "0.9rem" }}>Assistance</strong>
                    {s.assistanceRequests.length === 0 ? (
                      <p style={{ color: "#4a5568", fontSize: "0.85rem" }} className="mb-0">None.</p>
                    ) : (
                      s.assistanceRequests.map((r) => (
                        <div key={r.id} className="d-flex justify-content-between py-1" style={{ fontSize: "0.85rem" }}>
                          <span style={{ textTransform: "capitalize" }}>{r.requestType.replace(/_/g, " ")}</span>
                          <Badge color={r.status === "resolved" ? "success" : "warning"}>{r.status}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        <Modal isOpen={confirmOpen} toggle={() => setConfirmOpen(false)}>
          <ModalHeader toggle={() => setConfirmOpen(false)}>Clear history?</ModalHeader>
          <ModalBody>
            This will permanently hide all your past sessions. Your total violation points are not affected. This action is irreversible.
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button color="danger" onClick={handleClearHistory}>Clear</Button>
          </ModalFooter>
        </Modal>
      </Container>
    </AppLayout>
  );
}