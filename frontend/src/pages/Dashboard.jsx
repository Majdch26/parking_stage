import { useState, useEffect } from "react";
import { Container, Card, CardBody, Button, Badge } from "reactstrap";
import { Link } from "react-router-dom";
import { Car, Users, MessageCircle, ShieldAlert, CheckSquare, Clock } from "lucide-react";
import axiosClient from "../api/axiosClient";
import "../upark.css";

// ===== Design tokens =====
const T = {
  ink: "#10172a",
  inkSoft: "#4a5568",
  muted: "#8a94a6",
  asphalt1: "#161d2e",
  asphalt2: "#222c44",
  surface: "#ffffff",
  line: "#e3e7f0",
  blue: "#3b82f6",
  green: "#16a34a",
  greenSoft: "#e8faf0",
  amber: "#e8970b",
  amberSoft: "#fff6e3",
  slate: "#9aa4b8",
  slateSoft: "#f1f3f8",
  red: "#ef4444",
  redSoft: "#fdeeee",
};
const FONT_DISPLAY = "'Space Grotesk', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

const STATUS_LABEL = {
  waiting: "Waiting",
  notified: "Slot found",
};

const SESSION_STATUS_LABEL = {
  entered: "Entered, slot not scanned",
  parked: "Parked",
  left: "Left",
};

// ===== Car glyph =====
function CarGlyph({ status = "free", size = 20 }) {
  const color = status === "free" ? T.green : status === "res" ? T.amber : status === "mine" ? T.blue : T.slate;
  const filled = status === "occ" || status === "mine";
  const dashed = status === "res";
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 40 64" style={{ flexShrink: 0 }}>
      {filled ? (
        <>
          <rect x="6" y="6" width="28" height="52" rx="9" fill={color} />
          <path d="M11 20 L29 20 L26 30 L14 30 Z" fill="rgba(255,255,255,0.35)" />
        </>
      ) : (
        <g fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
          <rect x="6" y="6" width="28" height="52" rx="9" strokeDasharray={dashed ? "4 3" : undefined} />
          <path d="M11 20 L29 20 L26 30 L14 30 Z" />
        </g>
      )}
    </svg>
  );
}

function Bay({ status, label }) {
  return (
    <div
      title={label}
      style={{
        position: "relative",
        aspectRatio: "0.92",
        borderRadius: "5px",
        borderTop: "2.5px solid rgba(255,255,255,0.5)",
        borderBottom: "2.5px solid rgba(255,255,255,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {status === "free" && (
        <span
          style={{
            position: "absolute",
            inset: "16%",
            borderRadius: "50%",
            border: `1.5px solid ${T.green}`,
            opacity: 0.5,
            animation: "uparkPulse 2.2s ease-out infinite",
          }}
        />
      )}
      {status === "mine" && (
        <span
          style={{
            position: "absolute",
            top: -6,
            right: -2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: T.blue,
            color: "#fff",
            fontSize: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
          }}
        >
          ✓
        </span>
      )}
      <CarGlyph status={status} size={18} />
    </div>
  );
}

function AsphaltLot({ children }) {
  return (
    <div className="upk-asphalt-lot">
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: 12,
          bottom: 12,
          width: 0,
          borderLeft: "3px dashed rgba(255,255,255,0.2)",
          transform: "translateX(-50%)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

function StatCard({ accent, accentSoft, label, value, unit, change, changeTone, icon }) {
  const toneColors = {
    up: [T.green, T.greenSoft],
    down: [T.red, T.redSoft],
    neutral: [T.amber, T.amberSoft],
  };
  const [tColor, tSoft] = toneColors[changeTone] || toneColors.neutral;
  return (
    <div
      style={{
        background: T.surface,
        borderRadius: "18px",
        padding: "18px 20px",
        border: `1px solid ${T.line}`,
        boxShadow: "0 2px 10px rgba(20,30,60,0.03)",
        flex: "1 1 200px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: accentSoft,
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: T.ink, marginTop: 2, fontFamily: FONT_MONO }}>
        {value}
        {unit && <span style={{ fontSize: 13, fontWeight: 500, color: T.muted, marginLeft: 3, fontFamily: "inherit" }}>{unit}</span>}
      </div>
      {change && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            marginTop: 8,
            display: "inline-flex",
            padding: "3px 10px",
            borderRadius: 30,
            color: tColor,
            background: tSoft,
          }}
        >
          {change}
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 600, color: T.inkSoft }}>
      <span style={{ width: 14, height: 9, borderRadius: 2, background: color }} />
      {label}
    </span>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "10.5px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: "13.5px", fontWeight: 700, color: T.ink, marginTop: 2, fontFamily: FONT_MONO }}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const firstName = localStorage.getItem("firstName");
  const role = localStorage.getItem("role");

  const [waitingEntry, setWaitingEntry] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);

  const [activeWorkers, setActiveWorkers] = useState(null);
  const [parkingAreas, setParkingAreas] = useState(null);
  const [maintenanceSlots, setMaintenanceSlots] = useState(null);
  const [maintenanceBusyId, setMaintenanceBusyId] = useState(null);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleOverview, setScheduleOverview] = useState(null);

  const [me, setMe] = useState(null);
  const [mySession, setMySession] = useState(null);

  const [pendingAssistance, setPendingAssistance] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(null);

  const loadWaitingList = () => {
    axiosClient
      .get("/WaitingList/mine")
      .then((res) => {
        const active = res.data.find((e) => e.status === "waiting" || e.status === "notified");
        setWaitingEntry(active || null);
      })
      .catch(() => setWaitingEntry(null));

    axiosClient
      .get("/WaitingList/queue")
      .then((res) => {
        const mine = res.data.find((q) => q.isMe);
        setQueuePosition(mine?.position ?? null);
      })
      .catch(() => setQueuePosition(null));
  };

  const loadActiveWorkers = () => {
    axiosClient
      .get("/AdminDashboard/active-workers")
      .then((res) => setActiveWorkers(res.data))
      .catch(() => setActiveWorkers([]));
  };

  const loadParkingStatus = () => {
    axiosClient.get("/Parking/areas").then((res) => setParkingAreas(res.data)).catch(() => setParkingAreas([]));
    axiosClient.get("/Parking/maintenance-slots").then((res) => setMaintenanceSlots(res.data)).catch(() => setMaintenanceSlots([]));
  };

  const clearSlotMaintenance = (slotId) => {
    setMaintenanceBusyId(slotId);
    axiosClient
      .patch(`/Parking/slots/${slotId}/available`)
      .then(() => loadParkingStatus())
      .finally(() => setMaintenanceBusyId(null));
  };

  const getUpcomingWeekStart = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = (7 + (start.getDay() - 1)) % 7;
    start.setDate(start.getDate() - diff);
    start.setDate(start.getDate() + 7);
    return start;
  };

  const SCHEDULE_SHIFTS = [
    { code: "morning", label: "07:00-14:00" },
    { code: "evening", label: "14:00-21:00" },
  ];
  const SCHEDULE_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const scheduleWeekStart = getUpcomingWeekStart();
  const scheduleWeekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(scheduleWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const toLocalIso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const toggleScheduleOverview = () => {
    if (!scheduleOpen && scheduleOverview === null) {
      axiosClient
        .get("/WorkerSchedule/overview", { params: { weekStart: toLocalIso(scheduleWeekStart) } })
        .then((res) => setScheduleOverview(res.data))
        .catch(() => setScheduleOverview([]));
    }
    setScheduleOpen((open) => !open);
  };

  // Worker specific data
  const loadWorkerData = () => {
    axiosClient.get("/WorkerShift/status").then((res) => setIsCheckedIn(!!res.data.isCheckedIn)).catch(() => setIsCheckedIn(false));
    axiosClient.get("/Assistance/pending").then((res) => setPendingAssistance(res.data)).catch(() => setPendingAssistance([]));
  };

  useEffect(() => {
    if (role === "student") {
      loadWaitingList();
      loadParkingStatus();
      axiosClient.get("/Auth/me").then((res) => setMe(res.data)).catch(() => setMe(null));
      axiosClient.get("/Session/mine").then((res) => setMySession(res.data)).catch(() => setMySession(null));
    }
    if (role === "admin") {
      loadActiveWorkers();
      loadParkingStatus();
      const interval = setInterval(loadActiveWorkers, 15000);
      return () => clearInterval(interval);
    }
    if (role === "worker") {
      loadWorkerData();
      loadParkingStatus();
      const interval = setInterval(loadWorkerData, 15000);
      return () => clearInterval(interval);
    }
  }, [role]);

  const handleCancelWaiting = async () => {
    if (!waitingEntry) return;
    try {
      await axiosClient.post(`/WaitingList/${waitingEntry.id}/cancel`);
      setWaitingEntry(null);
      setQueuePosition(null);
    } catch {}
  };

  const fmtTime = (t) => (typeof t === "string" ? t.slice(0, 5) : t);
  const fmtDateTime = (d) =>
    d
      ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
      : "—";

  // ---- derived stats ----
  const totalCapacity = parkingAreas ? parkingAreas.reduce((s, a) => s + a.capacity, 0) : null;
  const totalAvailable = parkingAreas ? parkingAreas.reduce((s, a) => s + a.availableSlots, 0) : null;
  const occupancyRate =
    totalCapacity && totalCapacity > 0 ? Math.round(((totalCapacity - totalAvailable) / totalCapacity) * 100) : null;

  const violationPoints = me?.points ?? 0;
  const violationTone = violationPoints >= 70 ? T.red : violationPoints >= 40 ? T.amber : T.green;

  return (
    <Container style={{ maxWidth: "1040px", paddingBottom: "40px" }}>
      {/* Fonts + keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');
        @keyframes uparkPulse {
          0% { transform: scale(0.55); opacity: 0.7; }
          70% { transform: scale(1.25); opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Welcome banner */}
      <div className="upk-welcome-banner">
        <div className="upk-welcome-banner-content" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p className="upk-welcome-date">
              <span className="dot" />
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h2>Welcome, {firstName}</h2>
            <p className="upk-welcome-role">{role} account</p>
          </div>
        </div>
      </div>

      {/* ===== STUDENT DASHBOARD ===== */}
      {role === "student" && (
        <>
          {/* Stats row */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "22px" }}>
            <StatCard
              accent={T.green}
              accentSoft={T.greenSoft}
              label="Free spots"
              value={totalAvailable ?? "—"}
              unit={totalCapacity ? `/ ${totalCapacity}` : ""}
              change={parkingAreas ? "Live" : null}
              changeTone="up"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              }
            />
            <StatCard
              accent={T.blue}
              accentSoft="#eaf1ff"
              label="Occupancy rate"
              value={occupancyRate ?? "—"}
              unit={occupancyRate !== null ? "%" : ""}
              change="● Stable"
              changeTone="neutral"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 12a9 9 0 1 0 9-9" />
                  <path d="M3 12h9V3" />
                </svg>
              }
            />
            <StatCard
              accent={T.amber}
              accentSoft={T.amberSoft}
              label="My reservation"
              value={mySession?.hasReservation ? mySession.reservationSlotNumber : "—"}
              change={mySession?.hasReservation ? mySession.reservationAreaName : "No active reservation"}
              changeTone="neutral"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 9h18M9 4v16" />
                </svg>
              }
            />
            <StatCard
              accent={T.red}
              accentSoft={T.redSoft}
              label="Waiting list"
              value={queuePosition ?? "—"}
              change={waitingEntry ? STATUS_LABEL[waitingEntry.status] || waitingEntry.status : "Not in line"}
              changeTone="down"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
          </div>

          {/* Waiting list tracker */}
          {waitingEntry && (
            <Card className="mb-4" style={{ borderRadius: "18px", overflow: "hidden", border: "none" }}>
              <CardBody
                style={{
                  background: `linear-gradient(195deg, ${T.asphalt1}, ${T.asphalt2})`,
                  padding: "22px",
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px dashed rgba(255,255,255,0.25)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.55)", fontWeight: 700, letterSpacing: "0.06em", fontFamily: FONT_MONO }}>
                    POSITION
                  </span>
                  <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "white", fontFamily: FONT_DISPLAY }}>
                    {queuePosition ?? "—"}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <h6 style={{ color: "white", margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 700 }}>
                    {waitingEntry.status === "notified"
                      ? "A spot has been found for you!"
                      : `Waiting list — you're #${queuePosition ?? "—"}`}
                  </h6>
                  <p style={{ color: "rgba(255,255,255,0.65)", margin: "4px 0 0", fontSize: "0.8rem" }}>
                    Slot requested for <span style={{ fontFamily: FONT_MONO, color: "#9cc1ff" }}>{fmtTime(waitingEntry.priorityTime)}</span> ·{" "}
                    {STATUS_LABEL[waitingEntry.status] || waitingEntry.status}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Link to="/waiting-list">
                    <Button size="sm" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontWeight: 600, borderRadius: "30px" }}>
                      View queue
                    </Button>
                  </Link>
                  <Button size="sm" style={{ background: T.red, border: "none", borderRadius: "30px", fontWeight: 600 }} onClick={handleCancelWaiting}>
                    Leave
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Lot card + Session + Violation */}
          <div className="upk-lot-session-grid" style={{ display: "grid", gridTemplateColumns: "1.25fr 0.78fr", gap: "20px", marginBottom: "8px" }}>
            {/* Central Parking card */}
            <Card className="upk-parking-card">
              <CardBody>
                <div className="upk-parking-header">
                  <h3 className="upk-parking-title">Central Parking — Lot view</h3>
                  <Link to="/parking-status" className="upk-parking-link">See full map →</Link>
                </div>
                <p className="upk-parking-sub">Live floor markings — click a free spot to reserve it</p>

                <div className="upk-legend">
                  <span className="upk-legend-item"><span className="upk-legend-swatch" style={{ background: T.green }} /> Free</span>
                  <span className="upk-legend-item"><span className="upk-legend-swatch" style={{ background: T.slate }} /> Occupied</span>
                  <span className="upk-legend-item"><span className="upk-legend-swatch" style={{ background: T.amber }} /> Reserved</span>
                  <span className="upk-legend-item"><span className="upk-legend-swatch" style={{ background: T.blue }} /> My spot</span>
                </div>

                {parkingAreas === null ? (
                  <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "0.85rem" }}>Loading...</p>
                ) : parkingAreas.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "0.85rem" }}>No zones registered yet.</p>
                ) : (
                  parkingAreas.slice(0, 2).map((a) => {
                    const mySlot = mySession?.areaName === a.areaName ? mySession.slotNumber : null;
                    const bays = [
                      ...(mySlot ? ["mine"] : []),
                      ...Array(Math.max(a.availableSlots || 0, 0)).fill("free"),
                      ...Array(a.occupiedSlots || 0).fill("occ"),
                      ...Array(a.reservedSlots || 0).fill("res"),
                    ];
                    return (
                      <div key={a.id} className="upk-parking-area">
                        <div className="upk-parking-area-row">
                          <span className="upk-parking-area-name">{a.areaName}</span>
                          <span className="upk-parking-area-availability">{a.availableSlots} / {a.capacity} free</span>
                        </div>
                        <AsphaltLot>
                          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(bays.length || 1, 8)}, 1fr)`, gap: "7px" }}>
                            {bays.map((s, i) => (
                              <Bay key={i} status={s} label={`${a.areaName} — ${s}`} />
                            ))}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              position: "relative",
                              zIndex: 1,
                              marginTop: "14px",
                              fontFamily: FONT_MONO,
                              fontSize: "10px",
                              color: "rgba(255,255,255,0.4)",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                            }}
                          >
                            <span>← Entrance</span>
                            <span>Exit →</span>
                          </div>
                        </AsphaltLot>
                      </div>
                    );
                  })
                )}
              </CardBody>
            </Card>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <Card className="upk-session-card">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="upk-session-title">Active session</h4>
                    {mySession?.sessionId && mySession.status !== "left" && (
                      <span className="upk-session-status">
                        ● {SESSION_STATUS_LABEL[mySession.status]}
                      </span>
                    )}
                  </div>

                  {!mySession || !mySession.sessionId || mySession.status === "left" ? (
                    <p className="upk-session-empty">No active session. Scan your QR at the gate to start one.</p>
                  ) : (
                    <>
                      <div className="upk-session-ticket">
                        <div className="upk-session-vehicle-icon">
                          <Car size={20} color="#fff" />
                        </div>
                        <div>
                          <div className="upk-session-area">{mySession.areaName || "Zone not scanned yet"}</div>
                          <div className="upk-session-slot">{mySession.slotNumber || "— slot not scanned —"}</div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "14px" }}>
                        <DetailItem label="Entry" value={fmtDateTime(mySession.entryTime)} />
                        <DetailItem label="Slot scanned" value={fmtDateTime(mySession.slotScanTime)} />
                      </div>

                      <Link to="/session">
                        <Button size="sm" className="upk-session-button">View my session</Button>
                      </Link>
                    </>
                  )}
                </CardBody>
              </Card>

              <Card className="upk-violation-card">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h4 className="upk-violation-title">Violation points</h4>
                    <span className="upk-violation-badge" style={{ color: violationTone }}>
                      {violationPoints >= 100 ? "Banned" : violationPoints >= 70 ? "High level" : violationPoints >= 40 ? "Moderate level" : "Low level"}
                    </span>
                  </div>
                  <div className="upk-violation-value">
                    <span className="upk-violation-number">{violationPoints}</span>
                    <span className="upk-violation-max">/ 100 — banned at 100</span>
                  </div>
                  <div className="upk-violation-bar">
                    <span className="upk-violation-bar-fill" style={{ width: `${Math.min(violationPoints, 100)}%` }} />
                  </div>
                  <p className="upk-violation-note">
                    {me?.status === "banned"
                      ? "Your account is currently banned — contact the administration."
                      : "Points decrease over time without a new violation."}
                  </p>
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* ===== WORKER DASHBOARD ===== */}
      {role === "worker" && (
        <>
          {/* Quick stats */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "22px" }}>
            <div className="upk-card" style={{ padding: "18px 22px", flex: "1 1 180px", minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted }}>Shift status</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: isCheckedIn ? T.green : T.red, marginTop: 4 }}>
                {isCheckedIn === null ? "—" : isCheckedIn ? "Checked in" : "Off duty"}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                {isCheckedIn ? "You are on site" : "You are not checked in"}
              </div>
            </div>
            <div className="upk-card" style={{ padding: "18px 22px", flex: "1 1 180px", minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted }}>Pending assistance</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: T.amber, marginTop: 4 }}>
                {pendingAssistance === null ? "—" : pendingAssistance.length}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                {pendingAssistance?.length === 1 ? "request" : "requests"} waiting
              </div>
            </div>
            <div className="upk-card" style={{ padding: "18px 22px", flex: "1 1 180px", minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted }}>Maintenance</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: maintenanceSlots?.length > 0 ? T.red : T.green, marginTop: 4 }}>
                {maintenanceSlots?.length || 0}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                slots in maintenance
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "22px" }}>
            <Link to="/worker/check-in" style={{ textDecoration: "none" }}>
              <Card className="upk-card" style={{ padding: "20px", textAlign: "center", cursor: "pointer" }}>
                <CheckSquare size={28} color="#02457A" style={{ margin: "0 auto 8px" }} />
                <strong style={{ color: T.ink }}>Check-in / out</strong>
                <div style={{ fontSize: "0.8rem", color: T.muted }}>Start or end your shift</div>
              </Card>
            </Link>
            <Link to="/worker/assistance" style={{ textDecoration: "none" }}>
              <Card className="upk-card" style={{ padding: "20px", textAlign: "center", cursor: "pointer" }}>
                <Users size={28} color="#02457A" style={{ margin: "0 auto 8px" }} />
                <strong style={{ color: T.ink }}>Assistance</strong>
                <div style={{ fontSize: "0.8rem", color: T.muted }}>View and accept requests</div>
              </Card>
            </Link>
            <Link to="/worker/violation" style={{ textDecoration: "none" }}>
              <Card className="upk-card" style={{ padding: "20px", textAlign: "center", cursor: "pointer" }}>
                <ShieldAlert size={28} color="#02457A" style={{ margin: "0 auto 8px" }} />
                <strong style={{ color: T.ink }}>Add violation</strong>
                <div style={{ fontSize: "0.8rem", color: T.muted }}>Issue a violation to a student</div>
              </Card>
            </Link>
            <Link to="/worker/chat" style={{ textDecoration: "none" }}>
              <Card className="upk-card" style={{ padding: "20px", textAlign: "center", cursor: "pointer" }}>
                <MessageCircle size={28} color="#02457A" style={{ margin: "0 auto 8px" }} />
                <strong style={{ color: T.ink }}>Team chat</strong>
                <div style={{ fontSize: "0.8rem", color: T.muted }}>Talk with other workers</div>
              </Card>
            </Link>
            <Link to="/worker/schedule" style={{ textDecoration: "none" }}>
              <Card className="upk-card" style={{ padding: "20px", textAlign: "center", cursor: "pointer" }}>
                <Clock size={28} color="#02457A" style={{ margin: "0 auto 8px" }} />
                <strong style={{ color: T.ink }}>My schedule</strong>
                <div style={{ fontSize: "0.8rem", color: T.muted }}>Plan your shifts</div>
              </Card>
            </Link>
          </div>

          {/* Parking status mini view */}
          {parkingAreas && parkingAreas.length > 0 && (
            <Card className="upk-card mb-4">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 style={{ fontFamily: FONT_DISPLAY, color: T.ink, margin: 0, fontWeight: 700 }}>Parking status</h6>
                  <Link to="/parking-status" style={{ fontSize: "0.78rem", fontWeight: 700, color: T.blue, textDecoration: "none" }}>
                    See full map →
                  </Link>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: "12px" }}>
                  {parkingAreas.slice(0, 3).map((a) => (
                    <div key={a.id} style={{ background: T.surface, borderRadius: 12, padding: "12px", border: `1px solid ${T.line}` }}>
                      <strong style={{ color: T.ink }}>{a.areaName}</strong>
                      <div style={{ fontSize: "0.85rem", color: T.muted }}>
                        {a.availableSlots} / {a.capacity} free
                      </div>
                      <div style={{ height: 4, background: T.slateSoft, borderRadius: 4, marginTop: 6 }}>
                        <div style={{ height: "100%", width: `${((a.capacity - a.availableSlots) / a.capacity) * 100}%`, background: T.blue, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* ===== ADMIN DASHBOARD ===== */}
      {role === "admin" && (
        <>
          {/* Workers on site */}
          <Card className="mb-4" style={{ borderRadius: "18px", border: `1px solid ${T.line}`, boxShadow: "0 2px 10px rgba(20,30,60,0.04)" }}>
            <CardBody style={{ padding: "24px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 style={{ fontFamily: FONT_DISPLAY, color: T.ink, margin: 0, fontWeight: 700 }}>
                  Workers currently on site
                </h6>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: T.green, background: T.greenSoft, padding: "4px 13px", borderRadius: "30px" }}>
                  {activeWorkers ? activeWorkers.length : 0} on duty
                </span>
              </div>
              {activeWorkers === null ? (
                <p style={{ color: T.muted, margin: 0, fontSize: "0.85rem" }}>Loading...</p>
              ) : activeWorkers.length === 0 ? (
                <p style={{ color: T.muted, margin: 0, fontSize: "0.85rem" }}>No worker currently on duty.</p>
              ) : (
                activeWorkers.map((w) => (
                  <div
                    key={w.workerId}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "10px", marginBottom: "6px", background: T.greenSoft }}
                  >
                    <span style={{ color: T.ink, fontWeight: 700, fontSize: "0.85rem" }}>{w.workerName}</span>
                    <span style={{ color: T.green, fontSize: "0.78rem", fontFamily: FONT_MONO }}>
                      {w.areaName} · since {fmtDateTime(w.checkInTime)}
                    </span>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          {/* Parking status */}
          <Card className="mb-4" style={{ borderRadius: "18px", border: `1px solid ${T.line}`, boxShadow: "0 2px 10px rgba(20,30,60,0.04)" }}>
            <CardBody style={{ padding: "24px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 style={{ fontFamily: FONT_DISPLAY, color: T.ink, margin: 0, fontWeight: 700 }}>Parking status</h6>
                <Link to="/parking-status" style={{ fontSize: "0.78rem", fontWeight: 700, color: T.blue, textDecoration: "none" }}>
                  See full map →
                </Link>
              </div>

              {parkingAreas === null ? (
                <p style={{ color: T.muted, margin: 0, fontSize: "0.85rem" }}>Loading...</p>
              ) : (
                parkingAreas.map((a) => {
                  const bays = [
                    ...Array(a.availableSlots || 0).fill("free"),
                    ...Array(a.occupiedSlots || 0).fill("occ"),
                    ...Array(a.reservedSlots || 0).fill("res"),
                  ];
                  return (
                    <div key={a.id} style={{ marginBottom: "16px" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2" style={{ flexWrap: "wrap", gap: "6px" }}>
                        <strong style={{ color: T.ink, fontSize: "0.9rem" }}>{a.areaName}</strong>
                        <div className="d-flex gap-2" style={{ flexWrap: "wrap" }}>
                          <Badge style={{ background: T.greenSoft, color: T.green, fontFamily: FONT_MONO }}>{a.availableSlots} free</Badge>
                          <Badge style={{ background: T.slateSoft, color: T.inkSoft, fontFamily: FONT_MONO }}>{a.occupiedSlots} occupied</Badge>
                          <Badge style={{ background: T.amberSoft, color: T.amber, fontFamily: FONT_MONO }}>{a.reservedSlots} reserved</Badge>
                          {a.maintenanceSlots > 0 && <Badge style={{ background: T.redSoft, color: T.red, fontFamily: FONT_MONO }}>{a.maintenanceSlots} maintenance</Badge>}
                        </div>
                      </div>
                      <AsphaltLot>
                        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(bays.length || 1, 12)}, 1fr)`, gap: "7px" }}>
                          {bays.length === 0 ? (
                            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", fontFamily: FONT_MONO }}>No slots registered</span>
                          ) : (
                            bays.map((s, i) => <Bay key={i} status={s} label={`${a.areaName} #${i + 1} — ${s}`} />)
                          )}
                        </div>
                      </AsphaltLot>
                    </div>
                  );
                })
              )}

              {maintenanceSlots && maintenanceSlots.length > 0 && (
                <div className="mt-3" style={{ borderTop: `1px solid ${T.line}`, paddingTop: "12px" }}>
                  <strong style={{ fontSize: "0.85rem", color: T.ink }}>Slots under maintenance</strong>
                  {maintenanceSlots.map((s) => (
                    <div key={s.id} className="d-flex justify-content-between align-items-center" style={{ padding: "8px 4px" }}>
                      <span style={{ fontSize: "0.85rem", color: T.inkSoft, fontFamily: FONT_MONO }}>{s.areaName} — {s.slotNumber}</span>
                      <Button
                        size="sm"
                        disabled={maintenanceBusyId === s.id}
                        onClick={() => clearSlotMaintenance(s.id)}
                        style={{ background: T.green, border: "none", borderRadius: "30px", fontWeight: 600 }}
                      >
                        Mark as available
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Worker schedule */}
          <Card className="mb-4" style={{ borderRadius: "18px", border: `1px solid ${T.line}`, boxShadow: "0 2px 10px rgba(20,30,60,0.04)" }}>
            <CardBody style={{ padding: "24px" }}>
              <div className="d-flex justify-content-between align-items-center" style={{ cursor: "pointer" }} onClick={toggleScheduleOverview}>
                <h6 style={{ fontFamily: FONT_DISPLAY, color: T.ink, margin: 0, fontWeight: 700 }}>
                  Worker schedule — week of {scheduleWeekDays[0].toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })}
                </h6>
                <span style={{ color: T.blue, fontSize: "0.8rem", fontWeight: 700 }}>{scheduleOpen ? "Collapse ▲" : "Show ▼"}</span>
              </div>

              {scheduleOpen && (
                <div className="mt-3">
                  {scheduleOverview === null ? (
                    <p style={{ color: T.muted, margin: 0, fontSize: "0.85rem" }}>Loading...</p>
                  ) : scheduleOverview.length === 0 ? (
                    <p style={{ color: T.muted, margin: 0, fontSize: "0.85rem" }}>No worker has filled in their schedule for this week yet.</p>
                  ) : (
                    <>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "6px" }}>
                          <thead>
                            <tr>
                              <th style={{ minWidth: "70px" }} />
                              {scheduleWeekDays.map((d, i) => (
                                <th key={i} style={{ textAlign: "center", color: T.muted, fontSize: "0.72rem", fontWeight: 700, fontFamily: FONT_MONO }}>
                                  {SCHEDULE_DAY_LABELS[i]}
                                  <div style={{ fontSize: "0.68rem", color: T.muted, fontWeight: 500 }}>
                                    {d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {SCHEDULE_SHIFTS.map((shift) => (
                              <tr key={shift.code}>
                                <td style={{ color: T.ink, fontWeight: 700, fontSize: "0.74rem", fontFamily: FONT_MONO }}>{shift.label}</td>
                                {scheduleWeekDays.map((d, i) => {
                                  const dayIso = toLocalIso(d);
                                  const names = scheduleOverview
                                    .filter((e) => e.scheduleDate.slice(0, 10) === dayIso && e.shiftCode === shift.code)
                                    .map((e) => e.workerName);
                                  return (
                                    <td
                                      key={i}
                                      style={{
                                        textAlign: "center",
                                        verticalAlign: "top",
                                        borderRadius: "9px",
                                        padding: "6px 4px",
                                        minWidth: "78px",
                                        background: names.length > 0 ? T.amberSoft : T.slateSoft,
                                      }}
                                    >
                                      {names.length === 0 ? (
                                        <span style={{ color: T.muted, fontSize: "0.7rem" }}>—</span>
                                      ) : (
                                        names.map((n, idx) => (
                                          <div key={idx} style={{ fontSize: "0.7rem", color: T.amber, fontWeight: 700 }}>
                                            {n}
                                          </div>
                                        ))
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3" style={{ borderTop: `1px solid ${T.line}`, paddingTop: "10px" }}>
                        {Object.entries(
                          scheduleOverview.reduce((byWorker, entry) => {
                            (byWorker[entry.workerName] ||= []).push(entry);
                            return byWorker;
                          }, {})
                        ).map(([workerName, entries]) => (
                          <div key={workerName} className="d-flex justify-content-between" style={{ fontSize: "0.85rem", padding: "4px 0" }}>
                            <span style={{ color: T.ink, fontWeight: 700 }}>{workerName}</span>
                            <span style={{ color: entries.length * 7 >= 49 ? T.green : T.muted, fontFamily: FONT_MONO }}>
                              {entries.length * 7}h / 49h
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </Container>
  );
}