import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Alert, Button } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const T = {
  ink: "#10172a", inkSoft: "#4a5568", muted: "#8a94a6",
  asphalt1: "#161d2e", asphalt2: "#222c44",
  surface: "#ffffff", line: "#e3e7f0",
  blue: "#3b82f6", green: "#16a34a", greenSoft: "#e8faf0",
  amber: "#e8970b", amberSoft: "#fff6e3",
  slate: "#9aa4b8", slateSoft: "#f1f3f8", red: "#ef4444", redSoft: "#fdeeee",
};
const FONT_DISPLAY = "'Space Grotesk', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

const STATUS_MAP = { available: "free", occupied: "occ", reserved: "res", maintenance: "maint" };
const STATUS_LABEL_FR = { free: "Libre", occ: "Occupée", res: "Réservée", maint: "Maintenance", mine: "Votre place" };

function CarGlyph({ status, size = 18 }) {
  const color =
    status === "free" ? T.green :
    status === "res" ? T.amber :
    status === "mine" ? T.blue :
    status === "maint" ? T.red : T.slate;
  const filled = status === "occ" || status === "mine";
  const dashed = status === "res" || status === "maint";
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

function Bay({ status, num, clickable, onClick, onHover, onLeave }) {
  return (
    <div
      onMouseMove={(e) => onHover?.(e, num, status)}
      onMouseLeave={onLeave}
      onClick={clickable ? onClick : undefined}
      style={{
        position: "relative",
        aspectRatio: "0.92",
        borderRadius: "5px",
        cursor: clickable ? "pointer" : "default",
        borderTop: "2.5px solid rgba(255,255,255,0.5)",
        borderBottom: "2.5px solid rgba(255,255,255,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.15s",
        filter: status === "mine" ? "drop-shadow(0 0 8px rgba(59,130,246,0.55))" : "none",
      }}
      onMouseEnter={(e) => clickable && (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <span className="upk-status-bay-num">{num}</span>
      {status === "free" && (
        <span style={{ position: "absolute", inset: "18%", borderRadius: "50%", border: `1.5px solid ${T.green}`, opacity: 0.55, animation: "uparkPulse 2.2s ease-out infinite" }} />
      )}
      {status === "mine" && (
        <span style={{ position: "absolute", top: -6, right: -2, width: 16, height: 16, borderRadius: "50%", background: T.blue, color: "#fff", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✓</span>
      )}
      <CarGlyph status={status} />
    </div>
  );
}

function Pill({ dotColor, num, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 30, padding: "9px 18px", boxShadow: "0 2px 10px rgba(20,30,60,0.03)" }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor }} />
      <span style={{ fontSize: 19, fontWeight: 700, fontFamily: FONT_DISPLAY }}>{num}</span>
      <span style={{ fontSize: 12.5, color: T.inkSoft, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: T.inkSoft }}>
      <span style={{ width: 14, height: 9, borderRadius: 2, background: color }} />
      {label}
    </span>
  );
}

export default function ParkingStatus() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const [areas, setAreas] = useState([]);
  const [slotsByArea, setSlotsByArea] = useState({});
  const [mySession, setMySession] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(null);
  const [maintenanceMsg, setMaintenanceMsg] = useState(null);
  const [busySlotId, setBusySlotId] = useState(null);
  const tooltipRef = useRef(null);

  const loadAreas = () => {
    axiosClient.get("/Parking/areas").then((res) => setAreas(res.data)).catch(() => setAreas([]));
  };

  const loadSlotsForArea = (areaId) => {
    axiosClient
      .get(`/Parking/areas/${areaId}/slots/map`)
      .then((res) => setSlotsByArea((prev) => ({ ...prev, [areaId]: res.data })))
      .catch(() => {});
  };

  const loadAllSlots = (areaList) => {
    (areaList || areas).forEach((a) => loadSlotsForArea(a.id));
  };

  useEffect(() => {
    loadAreas();
    if (role === "student") {
      axiosClient.get("/Session/mine").then((res) => setMySession(res.data)).catch(() => setMySession(null));
    }
    if (role === "worker") {
      axiosClient.get("/WorkerShift/status").then((res) => setIsCheckedIn(!!res.data.isCheckedIn)).catch(() => setIsCheckedIn(false));
    }
  }, [role]);

  useEffect(() => {
    if (areas.length > 0) loadAllSlots(areas);
    const interval = setInterval(() => {
      loadAreas();
      if (areas.length > 0) loadAllSlots(areas);
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas.length]);

  const handleSlotClick = (slot, area) => {
    if (role !== "worker") return;
    if (!isCheckedIn) {
      setMaintenanceMsg({ type: "error", text: "Tu dois être check-in pour gérer la maintenance d'une place." });
      return;
    }
    if (slot.status !== "available" && slot.status !== "maintenance") return;

    setMaintenanceMsg(null);
    setBusySlotId(slot.id);
    const url = slot.status === "maintenance" ? `/Parking/slots/${slot.id}/available` : `/Parking/slots/${slot.id}/maintenance`;
    axiosClient
      .patch(url)
      .then(() => {
        setMaintenanceMsg({
          type: "success",
          text: slot.status === "maintenance" ? `Place ${slot.slotNumber} remise disponible.` : `Place ${slot.slotNumber} mise en maintenance.`,
        });
        loadSlotsForArea(area.id);
      })
      .catch((err) => setMaintenanceMsg({ type: "error", text: err.response?.data?.message || "Erreur lors de la mise à jour." }))
      .finally(() => setBusySlotId(null));
  };

  const handleHover = (e, num, status) => {
    const el = tooltipRef.current;
    if (!el) return;
    el.style.opacity = 1;
    el.style.left = e.clientX + 14 + "px";
    el.style.top = e.clientY + 14 + "px";
    el.innerHTML = `<span style="font-family:${FONT_MONO};color:#9cc1ff">${num}</span> — ${STATUS_LABEL_FR[status] || status}`;
  };
  const handleLeave = () => {
    if (tooltipRef.current) tooltipRef.current.style.opacity = 0;
  };

  const totalFree = Object.values(slotsByArea).flat().filter((s) => s.status === "available").length;
  const totalOcc = Object.values(slotsByArea).flat().filter((s) => s.status === "occupied").length;
  const totalRes = Object.values(slotsByArea).flat().filter((s) => s.status === "reserved").length;
  // "Gate" est une zone technique (utilisée pour l'affectation des workers),
  // ce n'est pas une zone de stationnement : on ne l'affiche jamais ici.
  const visibleAreas = areas.filter((a) => a.areaName?.trim().toLowerCase() !== "gate");
  const isLotFull = visibleAreas.length > 0 && visibleAreas.every((a) => a.availableSlots === 0);

  return (
    <AppLayout>
      <Container style={{ maxWidth: "1040px", paddingTop: "24px", paddingBottom: "40px" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');
          @keyframes uparkPulse { 0%{transform:scale(.55);opacity:.7;} 70%{transform:scale(1.25);opacity:0;} 100%{opacity:0;} }
        `}</style>

        {/* Titre – sans recherche ni badge */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "22px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.blue, display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, boxShadow: `0 0 0 3px ${T.greenSoft}` }} />
              Live floor markings
            </div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 27, fontWeight: 700, color: T.ink, margin: 0 }}>Parking map</h1>
          </div>
        </div>

        {role === "worker" && isCheckedIn === false && (
          <Alert color="warning">Tu n'es pas check-in -- tu peux consulter le plan mais pas gérer la maintenance des places.</Alert>
        )}
        {maintenanceMsg && <Alert color={maintenanceMsg.type === "success" ? "success" : "danger"}>{maintenanceMsg.text}</Alert>}

        {isLotFull && (
          <div
            style={{
              background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, padding: "16px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16,
              boxShadow: "0 2px 10px rgba(20,30,60,0.03)",
            }}
          >
            <div>
              <strong style={{ color: T.ink }}>The parking lot is full.</strong>
              <p style={{ color: T.muted, margin: 0, fontSize: "0.85rem" }}>Join the waiting list to get notified as soon as a spot frees up.</p>
            </div>
            <Button onClick={() => navigate("/waiting-list")} style={{ background: T.blue, border: "none", color: "white", fontWeight: 700, borderRadius: 30 }}>
              Waiting list
            </Button>
          </div>
        )}

        {/* stats pills */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 22 }}>
          <Pill dotColor={T.green} num={totalFree} label="Free" />
          <Pill dotColor={T.slate} num={totalOcc} label="Occupied" />
          <Pill dotColor={T.amber} num={totalRes} label="Reserved" />
          <span style={{ fontSize: 12.5, color: T.inkSoft, marginLeft: "auto", background: T.surface, border: `1px solid ${T.line}`, padding: "9px 16px", borderRadius: 30 }}>
            {role === "worker" && isCheckedIn ? (
              <>Click an <strong style={{ color: T.blue }}>available</strong> spot to send it to maintenance</>
            ) : (
              <>Hover a spot to see its status</>
            )}
          </span>
        </div>

        {/* legend */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
          <LegendItem color={T.green} label="Free" />
          <LegendItem color={T.slate} label="Occupied" />
          <LegendItem color={T.amber} label="Reserved" />
          <LegendItem color={T.blue} label="My spot" />
          <LegendItem color={T.red} label="Maintenance" />
        </div>

        {visibleAreas.length === 0 ? (
          <p style={{ color: T.muted }}>Loading...</p>
        ) : (
          visibleAreas.map((area) => {
            const slots = slotsByArea[area.id] || [];
            const free = slots.filter((s) => s.status === "available").length;
            return (
              <div key={area.id} style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.line}`, padding: 22, boxShadow: "0 2px 10px rgba(20,30,60,0.03)", marginBottom: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 34, height: 34, borderRadius: 10, background: T.asphalt1, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14 }}>
                      {area.areaName?.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "?"}
                    </span>
                    <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, fontWeight: 700, margin: 0, color: T.ink }}>{area.areaName}</h3>
                  </div>
                  <span style={{ fontSize: 13, color: T.inkSoft, fontFamily: FONT_MONO }}>
                    <strong style={{ color: T.green, fontWeight: 700 }}>{free}</strong> free / {slots.length || area.capacity}
                  </span>
                </div>

                {/* Fond des zones de voitures : maintenant #02457A */}
                <div
                  style={{
                    position: "relative",
                    borderRadius: 16,
                    padding: "24px 18px 16px",
                    overflow: "hidden",
                    background: "#02457A", // <-- couleur modifiée
                  }}
                >
                  {slots.length === 0 ? (
                    <p style={{ position: "relative", zIndex: 1, color: "rgba(255,255,255,0.6)", fontFamily: FONT_MONO, fontSize: 12 }}>Loading slots...</p>
                  ) : (
                    <div className="upk-status-grid">
                      {slots.map((s) => {
                        const isMine = role === "student" && mySession?.hasReservation && mySession.reservationAreaName === area.areaName && mySession.reservationSlotNumber === s.slotNumber;
                        const visualStatus = isMine ? "mine" : STATUS_MAP[s.status] || "occ";
                        const clickable = role === "worker" && isCheckedIn && (s.status === "available" || s.status === "maintenance") && busySlotId !== s.id;
                        return (
                          <Bay
                            key={s.id}
                            num={s.slotNumber}
                            status={visualStatus}
                            clickable={clickable}
                            onClick={() => handleSlotClick(s, area)}
                            onHover={handleHover}
                            onLeave={handleLeave}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div
          ref={tooltipRef}
          style={{
            position: "fixed", background: T.ink, color: "#fff", fontSize: 12, padding: "9px 13px", borderRadius: 10,
            pointerEvents: "none", opacity: 0, transition: "opacity 0.12s", zIndex: 2000, fontFamily: "'Inter', sans-serif",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        />
      </Container>
    </AppLayout>
  );
}