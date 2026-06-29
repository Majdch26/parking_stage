import { useEffect, useState } from "react";
import { Container, Card, CardBody, Badge } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

export default function WorkerHistory() {
  const [shifts, setShifts] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const load = () => {
    axiosClient
      .get("/WorkerShift/mine")
      .then((res) => setShifts(res.data))
      .catch(() => setShifts([]));
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

  const groups = {};
  (shifts || []).forEach((s) => {
    const dayKey = new Date(s.checkInTime).toLocaleDateString("en-US");
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(s);
  });
  const sortedDayKeys = Object.keys(groups).sort((a, b) => {
    const [d1, m1, y1] = a.split("/").map(Number);
    const [d2, m2, y2] = b.split("/").map(Number);
    return new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1);
  });

  if (shifts === null) {
    return (
      <AppLayout>
        <Container style={{ paddingTop: "24px" }}>
          <p style={{ color: "#6B7280" }}>Loading...</p>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container style={{ maxWidth: "700px", paddingTop: "24px", paddingBottom: "40px" }}>
        <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#02457A" }}>My shift history</h3>
        <p style={{ color: "#6B7280", marginBottom: "24px" }}>
          All your past shifts, grouped by date. Click a date to see the details.
        </p>

        {shifts.length === 0 ? (
          <Card className="upk-card">
            <CardBody>
              <p style={{ color: "#6B7280", margin: 0 }}>No history yet.</p>
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
                  border: selectedDate === dayKey ? "2px solid #02457A" : "1px solid #DDE3EC",
                }}
              >
                <CardBody className="text-center p-3">
                  <strong style={{ color: "#02457A" }}>{dayKey}</strong>
                  <div style={{ fontSize: "0.8rem", color: "#6B7280", marginTop: "4px" }}>
                    {groups[dayKey].length} shift{groups[dayKey].length > 1 ? "s" : ""}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {selectedDate && (
          <div className="mt-4">
            <h5 style={{ color: "#02457A", fontFamily: "Poppins, sans-serif", textTransform: "capitalize" }}>
              {fmtDateLabel(groups[selectedDate][0].checkInTime)}
            </h5>

            {groups[selectedDate].map((s) => (
              <Card key={s.id} className="mb-3 upk-card">
                <CardBody>
                  <Badge color={s.checkOutTime ? "secondary" : "success"} className="mb-2">
                    {s.checkOutTime ? "Shift ended" : "Ongoing"}
                  </Badge>

                  <p className="mb-1"><strong>Zone:</strong> {s.areaName}</p>
                  <p className="mb-1"><strong>Check-in:</strong> {fmtDateTime(s.checkInTime)}</p>
                  <p className="mb-0"><strong>Check-out:</strong> {fmtDateTime(s.checkOutTime)}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </AppLayout>
  );
}