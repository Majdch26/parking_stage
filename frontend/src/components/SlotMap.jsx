import { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import "../upark.css";

function naturalSort(a, b) {
  const re = /^([A-Za-z]+)(\d+)$/;
  const matchA = a.slotNumber.match(re);
  const matchB = b.slotNumber.match(re);
  if (matchA && matchB) {
    if (matchA[1] !== matchB[1]) return matchA[1].localeCompare(matchB[1]);
    return Number(matchA[2]) - Number(matchB[2]);
  }
  return a.slotNumber.localeCompare(b.slotNumber);
}

const STATUS_TO_CLASS = {
  available: "free",
  occupied: "occupied",
  reserved: "reserved",
  maintenance: "maintenance",
};

const STATUS_COLOR = {
  available: "#16a34a",
  occupied: "#9aa4b8",
  reserved: "#e8970b",
  maintenance: "#ef4444",
};

function CarGlyph({ status, selected }) {
  const color = selected ? "#3b82f6" : STATUS_COLOR[status] || "#9aa4b8";
  const filled = status === "occupied" || selected;
  const dashed = status === "reserved" || status === "maintenance";
  return (
    <svg viewBox="0 0 40 64">
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

export default function SlotMap({ areaId, selectedSlotId, onSelectSlot, selectableStatuses = ["available"], refreshKey }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!areaId) {
      setSlots([]);
      return;
    }
    setLoading(true);
    axiosClient
      .get(`/Parking/areas/${areaId}/slots/map`)
      .then((res) => setSlots([...res.data].sort(naturalSort)))
      .finally(() => setLoading(false));
  }, [areaId, refreshKey]);

  // Self-refresh every 10s on top of any external refreshKey, so a slot that gets
  // freed (expired reservation, ended reservation) shows up here without a reload.
  useEffect(() => {
    if (!areaId) return;
    const interval = setInterval(() => {
      axiosClient
        .get(`/Parking/areas/${areaId}/slots/map`)
        .then((res) => setSlots([...res.data].sort(naturalSort)))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [areaId]);

  if (!areaId) return null;
  if (loading) return <p style={{ color: "#8a94a6" }}>Chargement du plan...</p>;

  return (
    <div>
      <div style={{ display: "flex", gap: "14px", marginBottom: "14px", flexWrap: "wrap" }}>
        {Object.entries(STATUS_TO_CLASS).map(([status, cls]) => (
          <span
            key={status}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "11.5px", fontWeight: 600, color: "#4a5568" }}
          >
            <span style={{ width: 14, height: 9, borderRadius: 2, background: STATUS_COLOR[status] }} />
            <span style={{ textTransform: "capitalize" }}>{cls}</span>
          </span>
        ))}
      </div>

      <div className="upk-lot">
        <div className="upk-lot-grid">
          {slots.map((s) => {
            const isSelectable = selectableStatuses.includes(s.status);
            const isSelected = s.id === selectedSlotId;
            const cls = STATUS_TO_CLASS[s.status] || "occupied";
            return (
              <button
                key={s.id}
                type="button"
                disabled={!isSelectable}
                onClick={() => isSelectable && onSelectSlot(s.id, s.slotNumber, s.status)}
                className={`upk-bay ${cls} ${isSelected ? "selected" : ""}`}
                title={`${s.slotNumber} — ${s.status}`}
              >
                <span className="upk-bay-num">{s.slotNumber}</span>
                <CarGlyph status={s.status} selected={isSelected} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}