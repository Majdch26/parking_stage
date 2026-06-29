import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Input } from "reactstrap";
import { CalendarCheck } from "lucide-react";
import axiosClient from "../api/axiosClient";
import SlotMap from "../components/SlotMap";
import AppLayout from "../components/AppLayout";
import "../upark.css";

function ReservationContent() {
  const navigate = useNavigate();
  const [myReservations, setMyReservations] = useState(null);
  const [areas, setAreas] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    areaId: "",
    slotId: "",
    slotNumber: "",
    vehicleId: "",
    reservationDate: "",
    scheduledEntryTime: "",
    scheduledEndTime: "",
  });
  const [slotWindows, setSlotWindows] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState({ startIn: null, left: null });

  const todayIso = new Date().toLocaleDateString("en-CA");

  const loadReservations = () => {
    axiosClient
      .get("/Reservation/mine")
      .then((res) => setMyReservations(res.data))
      .catch(() => setMyReservations([]));
  };

  useEffect(() => {
    axiosClient.get("/Parking/areas").then((res) => {
      setAreas(res.data);
      if (res.data.length > 0) {
        const zoneA = res.data.find((a) => a.areaName === "Zone A");
        setForm((prev) => ({ ...prev, areaId: String((zoneA || res.data[0]).id) }));
      }
    });
    axiosClient.get("/Vehicle/mine").then((res) => setVehicles(res.data));
    loadReservations();
  }, []);

  // Helper pour créer un objet Date en heure locale
  const createLocalDate = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hours, minutes] = timeStr.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  };

  // Mise à jour des compteurs toutes les secondes
  useEffect(() => {
    const interval = setInterval(() => {
      const active = myReservations?.find(
        (r) => r.status === "pending" || r.status === "confirmed"
      );
      if (!active) {
        setCountdown({ startIn: null, left: null });
        return;
      }

      const now = new Date();
      const start = createLocalDate(active.reservationDate, active.scheduledEntryTime);
      const end = createLocalDate(active.reservationDate, active.scheduledEndTime);

      if (!start || !end) {
        setCountdown({ startIn: null, left: null });
        return;
      }

      const startDiff = start - now;
      const endDiff = end - now;

      let startIn = null;
      let left = null;

      if (startDiff > 0) {
        // Réservation future
        startIn = Math.floor(startDiff / 1000);
      } else if (endDiff > 0) {
        // Réservation en cours
        left = Math.floor(endDiff / 1000);
      } else {
        // Réservation terminée
        left = 0;
      }

      setCountdown({ startIn, left });
    }, 1000);

    return () => clearInterval(interval);
  }, [myReservations]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const loadSlotWindows = (slotId, date) => {
    if (!slotId || !date) {
      setSlotWindows(null);
      return;
    }
    axiosClient
      .get(`/Reservation/slot/${slotId}/windows`, { params: { date } })
      .then((res) => setSlotWindows(res.data))
      .catch(() => setSlotWindows([]));
  };

  const handleSelectArea = (areaId) => {
    setForm({ ...form, areaId: String(areaId), slotId: "", slotNumber: "" });
    setSlotWindows(null);
  };

  const handleSelectSlot = (slotId, slotNumber) => {
    setForm({ ...form, slotId, slotNumber });
    loadSlotWindows(slotId, form.reservationDate);
  };

  const handleDateChange = (e) => {
    setForm({ ...form, reservationDate: e.target.value });
    if (form.slotId) {
      loadSlotWindows(form.slotId, e.target.value);
    }
  };

  const activeReservation = myReservations?.find(
    (r) => r.status === "pending" || r.status === "confirmed"
  );

  const isLotFull = areas.length > 0 && areas.every((a) => a.availableSlots === 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.scheduledEndTime <= form.scheduledEntryTime) {
      setError("End time must be after start time.");
      return;
    }

    try {
      const payload = {
        SlotId: Number(form.slotId),
        ReservationDate: form.reservationDate,
        ScheduledEntryTime: form.scheduledEntryTime + ":00",
        ScheduledEndTime: form.scheduledEndTime + ":00",
      };
      if (vehicles.length > 1) {
        payload.VehicleId = Number(form.vehicleId);
      }

      await axiosClient.post("/Reservation", payload);
      setSuccess("Reservation created successfully!");
      const zoneA = areas.find((a) => a.areaName === "Zone A");
      setForm({
        areaId: (zoneA || areas[0]) ? String((zoneA || areas[0]).id) : "",
        slotId: "",
        slotNumber: "",
        vehicleId: "",
        reservationDate: "",
        scheduledEntryTime: "",
        scheduledEndTime: "",
      });
      setSlotWindows(null);
      loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || "Error while reserving.");
    }
  };

  const handleCancel = async (id) => {
    setError("");
    try {
      await axiosClient.post(`/Reservation/${id}/cancel`);
      loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || "Error while cancelling.");
    }
  };

  const fmtTime = (t) => (typeof t === "string" ? t.slice(0, 5) : t);

  // Formatage : 2h 30m 45s ou 30m 45s ou 45s
  const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined) return "—";
    if (seconds <= 0) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(" ");
  };

  return (
    <Container style={{ maxWidth: "760px", paddingTop: "24px", paddingBottom: "48px" }}>
      <div className="upk-banner">
        <div className="upk-banner-row">
          <div>
            <div className="upk-eyebrow">Book ahead</div>
            <h1>Reservation</h1>
            <p>Choose a zone, a spot, then confirm your booking.</p>
          </div>
          <div className="upk-banner-icon">
            <CalendarCheck size={22} color="#fff" />
          </div>
        </div>
      </div>

      {error && <div className="upk-pill red mb-3" style={{ display: "flex", width: "fit-content" }}>{error}</div>}
      {success && <div className="upk-pill green mb-3" style={{ display: "flex", width: "fit-content" }}>{success}</div>}

      {!activeReservation && isLotFull && (
        <div
          className="upk-card mb-3"
          style={{
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            border: "1.5px dashed #3b82f6",
          }}
        >
          <div>
            <strong style={{ color: "#10172a" }}>The parking lot is full.</strong>
            <p style={{ color: "#4a5568", margin: 0, fontSize: "0.85rem" }}>
              You can join the waiting list for the time of your choice.
            </p>
          </div>
          <button className="upk-btn upk-btn-primary" onClick={() => navigate("/waiting-list")}>
            Waiting list
          </button>
        </div>
      )}

      {activeReservation ? (
        <div className="upk-ticket">
          <span className="upk-label">Active reservation</span>
          <p style={{ fontSize: "1.15rem", fontWeight: 700, color: "#10172a", marginBottom: "4px", fontFamily: "var(--upk-font-display)" }}>
            {activeReservation.areaName} — Spot {activeReservation.slotNumber}
          </p>
          <p style={{ color: "#4a5568", marginBottom: "14px" }}>
            {new Date(activeReservation.reservationDate).toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long",
            })}{" "}
            from {fmtTime(activeReservation.scheduledEntryTime)} to {fmtTime(activeReservation.scheduledEndTime)}
          </p>

          {/* AFFICHAGE DES COMPTEURS */}
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
            {countdown.startIn !== null && countdown.startIn > 0 && (
              <div style={{ background: "#eaf1ff", padding: "10px 16px", borderRadius: "12px", flex: "1 1 auto" }}>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#3b82f6", fontWeight: 700 }}>
                  Starts in
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.3rem", fontWeight: 700, color: "#02457A" }}>
                  {formatDuration(countdown.startIn)}
                </div>
              </div>
            )}
            {countdown.left !== null && countdown.left > 0 && (
              <div style={{ background: "#e8faf0", padding: "10px 16px", borderRadius: "12px", flex: "1 1 auto" }}>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#16a34a", fontWeight: 700 }}>
                  Time left
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.3rem", fontWeight: 700, color: "#0e9d6b" }}>
                  {formatDuration(countdown.left)}
                </div>
              </div>
            )}
            {countdown.left !== null && countdown.left <= 0 && countdown.startIn === null && (
              <div style={{ background: "#fdeeee", padding: "10px 16px", borderRadius: "12px", flex: "1 1 auto" }}>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#ef4444", fontWeight: 700 }}>
                  Status
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.1rem", fontWeight: 700, color: "#dc3545" }}>
                  Ended
                </div>
              </div>
            )}
            {/* Si aucun timer n'est affiché, on montre le statut normalement */}
            {countdown.startIn === null && countdown.left === null && (
              <div style={{ background: "#f1f3f8", padding: "10px 16px", borderRadius: "12px", flex: "1 1 auto" }}>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280", fontWeight: 700 }}>
                  Status
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.1rem", fontWeight: 700, color: "#02457A" }}>
                  {activeReservation.status}
                </div>
              </div>
            )}
          </div>

          <span className="upk-pill blue mb-3" style={{ display: "inline-flex" }}>{activeReservation.status}</span>
          <br />
          <button className="upk-btn upk-btn-danger mt-2" onClick={() => handleCancel(activeReservation.id)}>
            Cancel reservation
          </button>
        </div>
      ) : (
        <div className="upk-card upk-card-pad">
          <Form onSubmit={handleSubmit}>
            {vehicles.length > 1 && (
              <div style={{ marginBottom: "26px" }}>
                <span className="upk-label">Vehicle</span>
                <Input
                  type="select"
                  name="vehicleId"
                  value={form.vehicleId}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: "12px", border: "1px solid #e3e7f0" }}
                >
                  <option value="">-- Choose a vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brandName} {v.modelName} ({v.plateNumber})
                    </option>
                  ))}
                </Input>
              </div>
            )}

            <div style={{ marginBottom: "26px" }}>
              <span className="upk-label">Zone</span>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {areas.map((a) => {
                  const isActive = form.areaId === String(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleSelectArea(a.id)}
                      className={`upk-chip ${isActive ? "active" : ""}`}
                    >
                      <span>{a.areaName}</span>
                      <span className="upk-chip-sub">{a.availableSlots} free</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {form.areaId && (
              <div style={{ marginBottom: "26px" }}>
                <span className="upk-label">Floor plan</span>
                <SlotMap
                  areaId={form.areaId}
                  selectedSlotId={form.slotId ? Number(form.slotId) : null}
                  onSelectSlot={handleSelectSlot}
                  selectableStatuses={["available", "reserved"]}
                />
                {form.slotNumber && (
                  <p style={{ marginTop: "12px", color: "#3b82f6", fontWeight: 700, fontFamily: "var(--upk-font-display)", fontSize: "0.9rem" }}>
                    Selected spot: {form.slotNumber}
                  </p>
                )}

                {form.slotNumber && form.reservationDate && (
                  <div className="mt-2">
                    {slotWindows === null ? (
                      <p style={{ color: "#8a94a6", fontSize: "0.85rem" }}>Checking existing bookings...</p>
                    ) : slotWindows.length === 0 ? (
                      <p style={{ color: "#16a34a", fontSize: "0.85rem" }}>
                        No reservation on {form.slotNumber} for this date — free all day.
                      </p>
                    ) : (
                      <div style={{ background: "#fff6e3", borderRadius: "12px", padding: "12px 16px" }}>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#e8970b", fontWeight: 700 }}>
                          {form.slotNumber} is already reserved during these windows that day:
                        </p>
                        {slotWindows.map((w, i) => (
                          <span key={i} style={{ fontSize: "0.85rem", color: "#e8970b", marginRight: "10px", fontFamily: "var(--upk-font-mono)" }}>
                            {fmtTime(w.startTime)}–{fmtTime(w.endTime)}
                          </span>
                        ))}
                        <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "#4a5568" }}>
                          Pick another time (before, between, or after) to reserve that same spot.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: "16px", marginBottom: "26px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "160px" }}>
                <span className="upk-label">Date</span>
                <Input
                  type="date"
                  name="reservationDate"
                  value={form.reservationDate}
                  onChange={handleDateChange}
                  min={todayIso}
                  required
                  style={{ borderRadius: "12px", border: "1px solid #e3e7f0" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "140px" }}>
                <span className="upk-label">Start time</span>
                <Input
                  type="time"
                  name="scheduledEntryTime"
                  value={form.scheduledEntryTime}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: "12px", border: "1px solid #e3e7f0" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "140px" }}>
                <span className="upk-label">End time</span>
                <Input
                  type="time"
                  name="scheduledEndTime"
                  value={form.scheduledEndTime}
                  onChange={handleChange}
                  required
                  style={{ borderRadius: "12px", border: "1px solid #e3e7f0" }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="upk-btn upk-btn-primary"
              style={{ width: "100%" }}
              disabled={!form.slotId}
            >
              Confirm reservation
            </button>
          </Form>
        </div>
      )}
    </Container>
  );
}

export default function Reservation() {
  return (
    <AppLayout>
      <ReservationContent />
    </AppLayout>
  );
}