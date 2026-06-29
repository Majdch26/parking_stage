import { useEffect, useState } from "react";
import { Container, Card, CardBody } from "reactstrap";
import axiosClient from "../api/axiosClient";
import RequireCheckedIn from "./RequireCheckedIn";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const SHIFTS = [
  { code: "morning", label: "07:00 - 14:00", startHour: 7 },
  { code: "evening", label: "14:00 - 21:00", startHour: 14 },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS_PER_SHIFT = 7;
const REQUIRED_HOURS_PER_WEEK = 49;
const REQUIRED_SHIFTS_PER_WEEK = REQUIRED_HOURS_PER_WEEK / HOURS_PER_SHIFT;

function getWeekStart(d) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function toLocalIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isWithin24Hours(date, startHour) {
  const shiftStart = new Date(date);
  shiftStart.setHours(startHour, 0, 0, 0);
  return shiftStart.getTime() - Date.now() < 24 * 60 * 60 * 1000;
}

function WorkerScheduleContent() {
  const [weekStart] = useState(() => {
    const today = new Date();
    const start = getWeekStart(today);
    start.setDate(start.getDate() + 7);
    return start;
  });

  const [reserved, setReserved] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState("");
  const [confirmMessage, setConfirmMessage] = useState(null);

  const workerName = `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("lastName") || ""}`.trim();

  const load = () => {
    axiosClient
      .get("/WorkerSchedule/week", { params: { weekStart: toLocalIsoDate(weekStart) } })
      .then((res) => {
        const set = new Set(
          res.data.map((s) => `${s.scheduleDate.slice(0, 10)}|${s.shiftCode}`)
        );
        setReserved(set);
      })
      .catch(() => setReserved(new Set()));
  };

  useEffect(() => { load(); }, []);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const toggle = (date, shiftCode) => {
    const key = `${toLocalIsoDate(date)}|${shiftCode}`;
    setError("");
    setConfirmMessage(null);
    setBusyKey(key);
    axiosClient
      .post("/WorkerSchedule/toggle", { scheduleDate: toLocalIsoDate(date), shiftCode })
      .then((res) => {
        setReserved((prev) => {
          const next = new Set(prev);
          if (res.data.isReserved) next.add(key);
          else next.delete(key);
          return next;
        });
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Error while scheduling.");
      })
      .finally(() => setBusyKey(null));
  };

  const fmtWeekLabel = (start) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const opts = { day: "2-digit", month: "2-digit" };
    return `${start.toLocaleDateString("en-US", opts)} → ${end.toLocaleDateString("en-US", opts)}`;
  };

  const myShifts = [];
  if (reserved) {
    days.forEach((d, i) => {
      SHIFTS.forEach((shift) => {
        const key = `${toLocalIsoDate(d)}|${shift.code}`;
        if (reserved.has(key)) {
          myShifts.push({
            key,
            day: DAY_LABELS[i],
            date: d,
            shiftLabel: shift.label,
            code: shift.code,
            locked: isWithin24Hours(d, shift.startHour),
          });
        }
      });
    });
  }

  const handleConfirm = () => {
    setError("");
    const totalHours = myShifts.length * HOURS_PER_SHIFT;
    if (totalHours < REQUIRED_HOURS_PER_WEEK) {
      setConfirmMessage({
        type: "error",
        text: `You must fill 49h for next week (${totalHours}h out of 49h so far -- ${REQUIRED_SHIFTS_PER_WEEK - myShifts.length} shift(s) remaining, any days).`,
      });
    } else {
      setConfirmMessage({ type: "success", text: "Schedule confirmed for next week. Thank you!" });
    }
  };

  return (
    <Container style={{ maxWidth: "800px", paddingTop: "24px", paddingBottom: "40px" }}>
      <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#02457A" }}>My schedule — next week</h3>
      <p style={{ color: "#6B7280", marginBottom: "8px" }}>
        Click a slot to reserve (orange) or release (green). You must fill exactly 49h for the week (7 shifts of 7h,
        distributed as you wish over the days — 0, 1 or 2 shifts per day). 49h is also the maximum: once you have 7 shifts,
        others are greyed out.
      </p>
      <strong style={{ color: "#11163D", display: "block", marginBottom: "16px" }}>
        {fmtWeekLabel(weekStart)}
      </strong>

      {error && <p style={{ color: "#dc3545" }}>{error}</p>}

      {reserved === null ? (
        <p style={{ color: "#6B7280" }}>Loading...</p>
      ) : (
        <Card className="upk-card mb-3">
          <CardBody style={{ padding: "18px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "8px" }}>
              <thead>
                <tr>
                  <th style={{ minWidth: "110px" }} />
                  {days.map((d, i) => (
                    <th key={i} style={{ textAlign: "center", color: "#6B7280", fontSize: "0.85rem", fontWeight: 600 }}>
                      {DAY_LABELS[i]}
                      <div style={{ fontSize: "0.75rem", color: "#A0A6B5" }}>
                        {d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SHIFTS.map((shift) => (
                  <tr key={shift.code}>
                    <td style={{ color: "#11163D", fontWeight: 600, fontSize: "0.85rem" }}>
                      {shift.label}
                    </td>
                    {days.map((d, i) => {
                      const key = `${toLocalIsoDate(d)}|${shift.code}`;
                      const isReserved = reserved.has(key);
                      const isBusy = busyKey === key;
                      const locked = isReserved && isWithin24Hours(d, shift.startHour);
                      const capReached = !isReserved && myShifts.length >= REQUIRED_SHIFTS_PER_WEEK;
                      return (
                        <td key={i} style={{ textAlign: "center" }}>
                          <button
                            disabled={isBusy || locked || capReached}
                            onClick={() => toggle(d, shift.code)}
                            title={
                              locked
                                ? "Less than 24h before this shift -- contact admin to cancel."
                                : capReached
                                  ? "You already have 7 shifts (49h) for this week."
                                  : isReserved
                                    ? `Reserved by ${workerName}`
                                    : "Click to reserve"
                            }
                            style={{
                              width: "100%",
                              minWidth: "70px",
                              height: "48px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: isBusy ? "wait" : (locked || capReached) ? "not-allowed" : "pointer",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              lineHeight: 1.2,
                              color: "white",
                              opacity: isBusy ? 0.6 : locked ? 0.85 : capReached ? 0.45 : 1,
                              background: isReserved ? (locked ? "#9CA3AF" : "#FB923C") : "#22C55E",
                            }}
                          >
                            {isReserved ? (
                              <span style={{ whiteSpace: "pre-line" }}>
                                {locked ? `🔒 Reserved\n${workerName}` : `Reserved\n${workerName}`}
                              </span>
                            ) : (
                              "Free"
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      <Card className="upk-card mb-4">
        <CardBody className="text-center" style={{ padding: "18px" }}>
          <button
            onClick={handleConfirm}
            className="upk-btn upk-btn-primary"
            style={{ padding: "10px 28px", fontSize: "1rem" }}
          >
            Confirm my schedule
          </button>
          {confirmMessage && (
            <p
              className="mt-3 mb-0"
              style={{ color: confirmMessage.type === "success" ? "#16A34A" : "#dc3545" }}
            >
              {confirmMessage.text}
            </p>
          )}
        </CardBody>
      </Card>

      <Card className="upk-card">
        <CardBody style={{ padding: "20px" }}>
          <h6 style={{ fontFamily: "Poppins, sans-serif", color: "#11163D", marginBottom: "12px" }}>
            My saved schedule
          </h6>
          {myShifts.length === 0 ? (
            <p style={{ color: "#6B7280", margin: 0 }}>
              You haven't reserved any slot for next week yet.
            </p>
          ) : (
            myShifts.map((s) => (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  marginBottom: "4px",
                  background: "#FFF7ED",
                }}
              >
                <div>
                  <span style={{ color: "#11163D", fontWeight: 600 }}>
                    {s.day} {s.date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" })}
                  </span>
                  <span style={{ color: "#9A3412", marginLeft: "10px" }}>{s.shiftLabel}</span>
                </div>

                {s.locked ? (
                  <span
                    title="Less than 24h before this shift -- contact admin to cancel."
                    style={{ color: "#9CA3AF", fontSize: "0.8rem", cursor: "default" }}
                  >
                    🔒 Locked
                  </span>
                ) : (
                  <button
                    onClick={() => toggle(s.date, s.code)}
                    disabled={busyKey === s.key}
                    title="Cancel this slot"
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#dc3545",
                      fontWeight: 700,
                      fontSize: "1rem",
                      cursor: busyKey === s.key ? "wait" : "pointer",
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </Container>
  );
}

export default function WorkerSchedule() {
  return (
    <AppLayout>
      <RequireCheckedIn>
        <WorkerScheduleContent />
      </RequireCheckedIn>
    </AppLayout>
  );
}