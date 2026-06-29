import { useState, useEffect } from "react";
import { Container, Card, CardBody, Badge, Button } from "reactstrap";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const SHIFT_LIMIT_MS = 7 * 60 * 60 * 1000;

export default function WorkerSession() {
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    axiosClient
      .get("/WorkerShift/mine")
      .then((res) => setShift(res.data.find((s) => !s.checkOutTime) || null))
      .catch(() => setShift(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!shift) {
      setElapsed(0);
      return;
    }
    const start = new Date(shift.checkInTime).getTime();
    const tick = () => setElapsed(Date.now() - start);
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [shift?.checkInTime]);

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleString("en-US", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const fmtElapsed = (ms) => {
    const totalMinutes = Math.floor(ms / 60000);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${String(m).padStart(2, "0")}min`;
  };

  if (loading) {
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
      <Container style={{ maxWidth: "600px", paddingTop: "24px", paddingBottom: "40px" }}>
        <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#02457A" }}>My session</h3>
        <p style={{ color: "#6B7280", marginBottom: "20px" }}>
          Your current shift, from check-in to check-out.
        </p>

        {!shift ? (
          <Card className="upk-card">
            <CardBody>
              <p style={{ color: "#6B7280", margin: 0 }}>You are not on duty right now.</p>
              <Link to="/worker/check-in">
                <Button color="primary" className="mt-3" style={{ background: "#02457A", border: "none" }}>Check-in</Button>
              </Link>
            </CardBody>
          </Card>
        ) : (
          <Card className="upk-card">
            <CardBody>
              <Badge color={elapsed >= SHIFT_LIMIT_MS ? "danger" : "success"} className="mb-3" style={{ background: elapsed >= SHIFT_LIMIT_MS ? "#dc3545" : "#02457A" }}>
                On duty — {shift.areaName}
              </Badge>

              <p className="mb-1"><strong>Check-in:</strong> {fmt(shift.checkInTime)}</p>
              <p className="mb-1"><strong>Shift time:</strong> {fmtElapsed(elapsed)} / 7h00
                {elapsed >= SHIFT_LIMIT_MS && (
                  <span style={{ color: "#dc3545" }}> — shift over, check-out recommended!</span>
                )}
              </p>

              <Link to="/worker/check-in">
                <Button color="danger" className="mt-3" style={{ background: "#dc3545", border: "none" }}>Check-out</Button>
              </Link>
            </CardBody>
          </Card>
        )}
      </Container>
    </AppLayout>
  );
}