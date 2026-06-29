import { useState, useEffect } from "react";
import { Container, Card, CardBody, Form, Input, Button, Alert } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const sectionLabelStyle = {
  fontFamily: "Poppins, sans-serif",
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "#6B7290",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
  marginBottom: "10px",
  display: "block",
};

const STATUS_STYLE = {
  waiting: { bg: "#EDEBFB", color: "#4530A8", label: "Waiting" },
  notified: { bg: "#E5EEFB", color: "#1D4ED8", label: "Slot found" },
  fulfilled: { bg: "#E8F5E9", color: "#2E7D32", label: "Reserved" },
  expired: { bg: "#ECEFF1", color: "#546E7A", label: "Expired" },
  cancelled: { bg: "#ECEFF1", color: "#546E7A", label: "Cancelled" },
};

export default function WaitingList() {
  const role = localStorage.getItem("role");
  const isWorker = role === "worker";
  const [myEntries, setMyEntries] = useState(null);
  const [queue, setQueue] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState("");
  const [priorityTime, setPriorityTime] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const loadAll = () => {
    axiosClient.get("/WaitingList/mine").then((res) => setMyEntries(res.data)).catch(() => setMyEntries([]));
    axiosClient.get("/WaitingList/queue").then((res) => setQueue(res.data)).catch(() => setQueue([]));
  };

  useEffect(() => {
    if (!isWorker) {
      axiosClient.get("/Vehicle/mine").then((res) => setVehicles(res.data));
    }
    loadAll();
  }, []);

  const activeEntry = myEntries?.find((e) => e.status === "waiting" || e.status === "notified");
  const myQueueRow = queue.find((q) => q.isMe);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!priorityTime) {
      setError("Choose the time you need a spot.");
      return;
    }

    try {
      const payload = { PriorityTime: priorityTime + ":00" };
      if (vehicles.length > 1) {
        if (!vehicleId) {
          setError("Choose your vehicle.");
          return;
        }
        payload.VehicleId = Number(vehicleId);
      }

      await axiosClient.post("/WaitingList", payload);
      setSuccess(true);
      setPriorityTime("");
      setVehicleId("");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Error while joining the waiting list.");
    }
  };

  const handleCancel = async (id) => {
    setError("");
    try {
      await axiosClient.post(`/WaitingList/${id}/cancel`);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Error while cancelling.");
    }
  };

  const fmtTime = (t) => (typeof t === "string" ? t.slice(0, 5) : t);

  return (
    <AppLayout>
      <Container style={{ maxWidth: "620px", paddingTop: "24px", paddingBottom: "48px" }}>
        <h2 style={{ fontFamily: "Poppins, sans-serif", color: "#02457A", marginBottom: "4px" }}>
          Waiting list
        </h2>
        <p style={{ color: "#6B7290", marginBottom: "28px" }}>
          {isWorker
            ? ""
            : "The parking lot is full? Tell us when you need a spot and we'll notify you as soon as one frees up."}
        </p>

        {isWorker ? (
          <Card className="upk-card" style={{ textAlign: "center", padding: "28px" }}>
            <p style={{ color: "#6B7280", margin: 0 }}>The waiting list is not available for workers.</p>
          </Card>
        ) : (
          <>
            {error && <Alert color="danger" className="mb-3">{error}</Alert>}
            {success && (
              <Alert style={{ background: "#E8F5E9", border: "1px solid #4CAF50", color: "#2E7D32", borderRadius: "12px", fontWeight: 600 }}>
                ✅ Added to the waiting list!
              </Alert>
            )}

            {myEntries === null ? (
              <p style={{ color: "#6B7280" }}>Loading...</p>
            ) : activeEntry ? (
              <>
                <Card className="mb-4 upk-card" style={{ overflow: "hidden" }}>
                  <CardBody
                    style={{
                      background: "linear-gradient(135deg, #02457A 0%, #018ABE 100%)",
                      padding: "28px",
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        width: "84px",
                        height: "84px",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.18)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.8)", fontWeight: 700, letterSpacing: "0.5px" }}>
                        POSITION
                      </span>
                      <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "white", fontFamily: "Poppins, sans-serif" }}>
                        {myQueueRow?.position ?? "—"}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <h3 style={{ color: "white", margin: 0, fontFamily: "Poppins, sans-serif", fontSize: "1.1rem" }}>
                        {activeEntry.status === "notified"
                          ? "A spot has been found for you!"
                          : `You are #${myQueueRow?.position ?? "—"} in line`}
                      </h3>
                      <p style={{ color: "rgba(255,255,255,0.85)", margin: "4px 0 0", fontSize: "0.85rem" }}>
                        Spot requested for {fmtTime(activeEntry.priorityTime)}
                      </p>
                    </div>
                    <span
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        color: "white",
                        padding: "5px 14px",
                        borderRadius: "20px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {STATUS_STYLE[activeEntry.status]?.label || activeEntry.status}
                    </span>
                  </CardBody>
                </Card>

                <Card className="mb-4 upk-card">
                  <CardBody style={{ padding: "24px" }}>
                    <span style={sectionLabelStyle}>Live queue</span>
                    {queue.map((q) => (
                      <div
                        key={q.position}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          background: q.isMe ? "#F7F5FE" : "transparent",
                          border: q.isMe ? "1px solid #02457A" : "none",
                          marginBottom: "4px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontWeight: 700, color: q.isMe ? "#02457A" : "#6B7280", minWidth: "20px" }}>
                            {q.position}
                          </span>
                          <span style={{ fontWeight: q.isMe ? 700 : 500, color: "#11163D" }}>
                            {q.isMe ? "You" : `Student #${q.position}`}
                          </span>
                        </div>
                        <span style={{ color: "#6B7280", fontSize: "0.85rem" }}>
                          {fmtTime(q.priorityTime)}
                        </span>
                      </div>
                    ))}
                  </CardBody>
                </Card>

                <Button color="danger" size="sm" onClick={() => handleCancel(activeEntry.id)} style={{ background: "#dc3545", border: "none" }}>
                  Leave waiting list
                </Button>
              </>
            ) : (
              <Card className="upk-card" style={{ padding: "8px" }}>
                <CardBody style={{ padding: "28px" }}>
                  <Form onSubmit={handleSubmit}>
                    {vehicles.length > 1 && (
                      <div style={{ marginBottom: "28px" }}>
                        <span style={sectionLabelStyle}>Vehicle</span>
                        <Input type="select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
                          <option value="">-- Choose a vehicle --</option>
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.brandName} {v.modelName} ({v.plateNumber})
                            </option>
                          ))}
                        </Input>
                      </div>
                    )}

                    <div style={{ marginBottom: "28px" }}>
                      <span style={sectionLabelStyle}>Desired time</span>
                      <Input type="time" value={priorityTime} onChange={(e) => setPriorityTime(e.target.value)} required />
                      <p style={{ fontSize: "0.8rem", color: "#6B7280", marginTop: "8px", marginBottom: 0 }}>
                        Priority is given to the closest time, not by registration order.
                      </p>
                    </div>

                    <Button className="upk-btn upk-btn-primary" type="submit" block style={{ fontSize: "0.95rem", padding: "13px", width: "100%" }}>
                      Join the waiting list
                    </Button>
                  </Form>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </Container>
    </AppLayout>
  );
}