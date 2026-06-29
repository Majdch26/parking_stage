import { useState, useEffect } from "react";
import { Container } from "reactstrap";
import { LogIn, MapPin, LogOut, ShieldAlert, LifeBuoy } from "lucide-react";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const SESSION_STATUS_LABEL = {
  entered: "Entered, slot not scanned",
  parked: "Parked",
  left: "Left",
};

export default function Session() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient
      .get("/Session/mine")
      .then((res) => setSession(res.data))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
      : null;

  const content = loading ? (
    <Container style={{ paddingTop: "60px" }}>
      <p style={{ color: "#8a94a6" }}>Loading...</p>
    </Container>
  ) : (
    <Container style={{ maxWidth: "680px", paddingTop: "24px", paddingBottom: "48px" }}>
      <div className="upk-banner">
        <div className="upk-banner-row">
          <div>
            <div className="upk-eyebrow">{session?.sessionId && session.status !== "left" ? "Live now" : "No active entry"}</div>
            <h1>My session</h1>
            <p>Everything that happened from gate to gate. It resets on each new entry.</p>
          </div>
          <div className="upk-banner-icon">
            <LogIn size={22} color="#fff" />
          </div>
        </div>
      </div>

      {!session || !session.sessionId ? (
        <div className="upk-card upk-card-pad" style={{ color: "#8a94a6", textAlign: "center" }}>
          No recent session. Scan your QR at the gate to start one.
        </div>
      ) : (
        <>
          {/* Timeline card */}
          <div className="upk-card upk-card-pad mb-4">
            <span className="upk-label">Gate-to-gate timeline</span>

            <div className="upk-timeline">
              <div className="upk-timeline-item">
                <span className="upk-timeline-dot done" />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <LogIn size={15} color="#16a34a" />
                  <strong style={{ fontSize: "0.92rem", color: "#10172a" }}>Entry scanned</strong>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#4a5568", marginLeft: 23, fontFamily: "var(--upk-font-mono)" }}>
                  {fmt(session.entryTime) || "—"}
                </div>
              </div>

              <div className="upk-timeline-item">
                <span className={`upk-timeline-dot ${session.slotNumber ? "done" : "pending"}`} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin size={15} color={session.slotNumber ? "#16a34a" : "#9aa4b8"} />
                  <strong style={{ fontSize: "0.92rem", color: "#10172a" }}>Slot scanned</strong>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#4a5568", marginLeft: 23, fontFamily: "var(--upk-font-mono)" }}>
                  {session.slotNumber ? `${session.areaName} — ${session.slotNumber}` : "Not yet"}
                </div>
              </div>

              <div className="upk-timeline-item">
                <span className={`upk-timeline-dot ${session.exitTime ? "done" : "pending"}`} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <LogOut size={15} color={session.exitTime ? "#16a34a" : "#9aa4b8"} />
                  <strong style={{ fontSize: "0.92rem", color: "#10172a" }}>Exit scanned</strong>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#4a5568", marginLeft: 23, fontFamily: "var(--upk-font-mono)" }}>
                  {fmt(session.exitTime) || "Not yet"}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3" style={{ flexWrap: "wrap", gap: 8 }}>
              <span className={`upk-pill ${session.status === "left" ? "slate" : session.status === "parked" ? "green" : "amber"}`}>
                <span className="dot" />
                {SESSION_STATUS_LABEL[session.status]}
              </span>
              {session.hasReservation && (
                <span className="upk-pill blue">
                  Reserved · {session.reservationAreaName} {session.reservationSlotNumber}
                </span>
              )}
            </div>
          </div>

          {/* Violations */}
          <div className="upk-card upk-card-pad mb-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <ShieldAlert size={16} color="#ef4444" />
              <h5 style={{ fontFamily: "var(--upk-font-display)", color: "#10172a", margin: 0, fontSize: "0.98rem" }}>
                Violations this session
              </h5>
            </div>
            {(!session.violations || session.violations.length === 0) ? (
              <p style={{ color: "#8a94a6", margin: 0, fontSize: "0.88rem" }}>No violations for this session.</p>
            ) : (
              session.violations.map((v) => (
                <div
                  key={v.id}
                  className="d-flex justify-content-between align-items-center py-2"
                  style={{ borderBottom: "1px solid #f1f3f8" }}
                >
                  <div>
                    <strong style={{ textTransform: "capitalize", fontSize: "0.9rem" }}>
                      {v.violationTypeCode.replace(/_/g, " ")}
                    </strong>
                    <div style={{ fontSize: "0.78rem", color: "#8a94a6", fontFamily: "var(--upk-font-mono)" }}>
                      {fmt(v.createdAt)}
                    </div>
                  </div>
                  <span className="upk-pill red">+{v.points} pts</span>
                </div>
              ))
            )}
          </div>

          {/* Assistance */}
          <div className="upk-card upk-card-pad">
            <div className="d-flex align-items-center gap-2 mb-3">
              <LifeBuoy size={16} color="#3b82f6" />
              <h5 style={{ fontFamily: "var(--upk-font-display)", color: "#10172a", margin: 0, fontSize: "0.98rem" }}>
                My assistance requests
              </h5>
            </div>
            {(!session.assistanceRequests || session.assistanceRequests.length === 0) ? (
              <p style={{ color: "#8a94a6", margin: 0, fontSize: "0.88rem" }}>No request for this session.</p>
            ) : (
              session.assistanceRequests.map((r) => (
                <div
                  key={r.id}
                  className="d-flex justify-content-between align-items-center py-2"
                  style={{ borderBottom: "1px solid #f1f3f8" }}
                >
                  <div>
                    <strong style={{ textTransform: "capitalize", fontSize: "0.9rem" }}>
                      {r.requestType.replace(/_/g, " ")}
                    </strong>
                    <div style={{ fontSize: "0.78rem", color: "#8a94a6" }}>
                      {r.areaName} — {r.slotNumber} · {fmt(r.createdAt)}
                      {r.workerName && <> · handled by {r.workerName}</>}
                    </div>
                  </div>
                  <span className={`upk-pill ${r.status === "resolved" ? "green" : r.status === "in_progress" ? "blue" : "amber"}`}>
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Container>
  );

  return <AppLayout>{content}</AppLayout>;
}