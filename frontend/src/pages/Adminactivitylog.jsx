import { useEffect, useState } from "react";
import { Container, Card, CardBody, Badge, Button } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const STATUS_LABEL = { entered: "Entered, slot not scanned", parked: "Parked", left: "Left" };
const STATUS_COLOR = { entered: "warning", parked: "success", left: "secondary" };
const REQUEST_STATUS_LABEL = { pending: "Pending", in_progress: "In progress", resolved: "Resolved" };
const REQUEST_STATUS_COLOR = { pending: "warning", in_progress: "info", resolved: "success" };

export default function AdminActivityLog() {
  const [view, setView] = useState("students");
  const [sessions, setSessions] = useState(null);
  const [shifts, setShifts] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    axiosClient.get("/ActivityLog").then((res) => setSessions(res.data)).catch(() => setSessions([]));
    axiosClient.get("/ActivityLog/workers").then((res) => setShifts(res.data)).catch(() => setShifts([]));
  }, []);

  useEffect(() => {
    setSelectedDate(null);
  }, [view]);

  const fmtDateTime = (d) =>
    d
      ? new Date(d).toLocaleString("en-US", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
      : "—";

  const fmtDateLabel = (d) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const renderAssistance = (requests) => (
    <div className="mt-3">
      <strong style={{ fontSize: "0.9rem" }}>Assistance requests</strong>
      {requests.length === 0 ? (
        <p style={{ color: "#4a5568", fontSize: "0.85rem" }} className="mb-0">None.</p>
      ) : (
        requests.map((r) => (
          <div key={r.id} className="d-flex justify-content-between py-1" style={{ fontSize: "0.85rem" }}>
            <span style={{ textTransform: "capitalize" }}>
              {r.requestType.replace(/_/g, " ")}{r.workerName ? ` — ${r.workerName}` : ""}
            </span>
            <Badge color={REQUEST_STATUS_COLOR[r.status]}>{REQUEST_STATUS_LABEL[r.status] || r.status}</Badge>
          </div>
        ))
      )}
    </div>
  );

  const rawData = view === "students" ? sessions : shifts;
  const dateKeyOf = (item) => (view === "students" ? item.entryTime : item.checkInTime);

  const groups = {};
  (rawData || []).forEach((item) => {
    const dayKey = new Date(dateKeyOf(item)).toLocaleDateString("en-US");
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(item);
  });
  const sortedDayKeys = Object.keys(groups).sort((a, b) => {
    const [d1, m1, y1] = a.split("/").map(Number);
    const [d2, m2, y2] = b.split("/").map(Number);
    return new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1);
  });

  const loading = view === "students" ? sessions === null : shifts === null;

  return (
    <AppLayout>
      <Container style={{ maxWidth: "750px", paddingTop: "24px", paddingBottom: "40px" }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#02457A", margin: 0 }}>
            Activity Log
          </h3>
          <div className="d-flex gap-2">
            <Button
              size="sm"
              color={view === "students" ? "primary" : "secondary"}
              outline={view !== "students"}
              onClick={() => setView("students")}
              style={view === "students" ? { background: "#02457A", border: "none" } : {}}
            >
              Students
            </Button>
            <Button
              size="sm"
              color={view === "workers" ? "primary" : "secondary"}
              outline={view !== "workers"}
              onClick={() => setView("workers")}
              style={view === "workers" ? { background: "#02457A", border: "none" } : {}}
            >
              Workers
            </Button>
          </div>
        </div>
        <p style={{ color: "#4a5568", marginBottom: "24px" }}>
          {view === "students"
            ? "All student sessions, grouped by date."
            : "All worker shifts, grouped by date."}{" "}
          Click a date to see the details.
        </p>

        {loading ? (
          <p style={{ color: "#4a5568" }}>Loading...</p>
        ) : (rawData || []).length === 0 ? (
          <Card className="upk-card">
            <CardBody>
              <p style={{ color: "#4a5568", margin: 0 }}>No activity recorded.</p>
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
                    {groups[dayKey].length} {view === "students" ? "session" : "shift"}{groups[dayKey].length > 1 ? "s" : ""}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {selectedDate && view === "students" && (
          <div className="mt-4">
            <h5 style={{ color: "#02457A", fontFamily: "'Space Grotesk', sans-serif", textTransform: "capitalize" }}>
              {fmtDateLabel(groups[selectedDate][0].entryTime)}
            </h5>

            {groups[selectedDate].map((s) => (
              <Card key={s.sessionId} className="mb-3 upk-card">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <strong style={{ color: "#10172a" }}>{s.studentName}</strong>
                    <Badge color={STATUS_COLOR[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                  </div>

                  <p className="mb-1"><strong>Entry:</strong> {fmtDateTime(s.entryTime)}</p>
                  <p className="mb-1"><strong>Slot scanned:</strong> {s.slotNumber ? `${s.areaName} — ${s.slotNumber}` : "—"}</p>
                  <p className="mb-1"><strong>Exit:</strong> {fmtDateTime(s.exitTime)}</p>
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
                      <p style={{ color: "#4a5568", fontSize: "0.85rem" }} className="mb-0">None.</p>
                    ) : (
                      s.violations.map((v) => (
                        <div key={v.id} className="d-flex justify-content-between py-1" style={{ fontSize: "0.85rem" }}>
                          <span style={{ textTransform: "capitalize" }}>{v.violationTypeCode.replace(/_/g, " ")}</span>
                          <Badge color="danger">+{v.points} pts</Badge>
                        </div>
                      ))
                    )}
                  </div>

                  {renderAssistance(s.assistanceRequests || [])}
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {selectedDate && view === "workers" && (
          <div className="mt-4">
            <h5 style={{ color: "#02457A", fontFamily: "'Space Grotesk', sans-serif", textTransform: "capitalize" }}>
              {fmtDateLabel(groups[selectedDate][0].checkInTime)}
            </h5>

            {groups[selectedDate].map((s) => (
              <Card key={s.shiftId} className="mb-3 upk-card">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <strong style={{ color: "#10172a" }}>{s.workerName}</strong>
                    <Badge color={s.checkOutTime ? "secondary" : "success"}>
                      {s.checkOutTime ? "Shift ended" : "Ongoing"}
                    </Badge>
                  </div>

                  <p className="mb-1"><strong>Zone:</strong> {s.areaName}</p>
                  <p className="mb-1"><strong>Check-in:</strong> {fmtDateTime(s.checkInTime)}</p>
                  <p className="mb-1"><strong>Check-out:</strong> {fmtDateTime(s.checkOutTime)}</p>

                  {renderAssistance(s.assistanceRequests || [])}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </AppLayout>
  );
}