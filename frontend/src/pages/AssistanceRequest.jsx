import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input } from "reactstrap";
import { Container } from "reactstrap";
import { LifeBuoy } from "lucide-react";
import axiosClient from "../api/axiosClient";
import SlotMap from "../components/SlotMap";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const HELP_TYPES = [
  { value: "parking_help", label: "Parking help" },
  { value: "accident", label: "Accident" },
  { value: "security_issue", label: "Security issue" },
  { value: "car_problem", label: "Car problem" },
  { value: "other", label: "Other" },
];

function AssistanceRequestContent() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [areaId, setAreaId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [slotNumber, setSlotNumber] = useState("");
  const [requestType, setRequestType] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    axiosClient.get("/Parking/areas").then((res) => {
      setAreas(res.data);
      if (res.data.length > 0) setAreaId(String(res.data[0].id));
    });
  }, []);

  const handleSelectArea = (id) => {
    setAreaId(String(id));
    setSlotId("");
    setSlotNumber("");
  };

  const handleSelectSlot = (id, number) => {
    setSlotId(id);
    setSlotNumber(number);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!slotId) {
      setError("Please select your spot on the map.");
      return;
    }
    if (!requestType) {
      setError("Please select a type of help.");
      return;
    }
    if (requestType === "other" && !details.trim()) {
      setError("Please describe your issue in the 'Other' field.");
      return;
    }

    try {
      await axiosClient.post("/Assistance", {
        SlotId: Number(slotId),
        RequestType: requestType,
        Details: requestType === "other" ? details.trim() : null,
      });
      setSuccess(true);
      setRequestType("");
      setDetails("");
      setSlotId("");
      setSlotNumber("");
    } catch (err) {
      setError(err.response?.data?.message || "Error sending request.");
    }
  };

  return (
    <Container style={{ maxWidth: "680px", paddingTop: "24px", paddingBottom: "48px" }}>
      <div className="upk-banner">
        <div className="upk-banner-row">
          <div>
            <div className="upk-eyebrow">Need a hand?</div>
            <h1>Request assistance</h1>
            <p>Tell us where you are and what kind of help you need.</p>
          </div>
          <div className="upk-banner-icon">
            <LifeBuoy size={22} color="#fff" />
          </div>
        </div>
      </div>

      {error && (
        <div className="upk-pill red mb-3" style={{ display: "flex", width: "fit-content" }}>{error}</div>
      )}

      {success && (
        <div
          className="upk-card mb-3"
          style={{
            border: "1.5px dashed #16a34a",
            background: "#e8faf0",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <span style={{ color: "#16a34a", fontWeight: 700 }}>✅ Request sent successfully!</span>
          <button className="upk-btn upk-btn-dark" onClick={() => navigate("/session")}>
            View my session
          </button>
        </div>
      )}

      <div className="upk-card upk-card-pad">
        <Form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "26px" }}>
            <span className="upk-label">Zone</span>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {areas.map((a) => {
                const isActive = areaId === String(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleSelectArea(a.id)}
                    className={`upk-chip ${isActive ? "active" : ""}`}
                  >
                    {a.areaName}
                  </button>
                );
              })}
            </div>
          </div>

          {areaId && (
            <div style={{ marginBottom: "26px" }}>
              <span className="upk-label">Floor plan — pick where you're parked</span>
              <SlotMap
                areaId={areaId}
                selectedSlotId={slotId ? Number(slotId) : null}
                onSelectSlot={handleSelectSlot}
                selectableStatuses={["available", "occupied", "reserved", "maintenance"]}
              />
              {slotNumber && (
                <p style={{ marginTop: "10px", fontSize: "0.85rem", color: "#4a5568" }}>
                  Selected spot: <strong style={{ color: "#10172a", fontFamily: "var(--upk-font-mono)" }}>{slotNumber}</strong>
                </p>
              )}
            </div>
          )}

          <div style={{ marginBottom: "26px" }}>
            <span className="upk-label">Type of help</span>
            <Input
              type="select"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              required
              style={{ borderRadius: "12px", border: "1px solid #e3e7f0" }}
            >
              <option value="">-- Select --</option>
              {HELP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Input>
          </div>

          {requestType === "other" && (
            <div style={{ marginBottom: "26px" }}>
              <span className="upk-label">Describe your issue</span>
              <Input
                type="textarea"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain briefly what's going on..."
                style={{ borderRadius: "12px", border: "1px solid #e3e7f0" }}
              />
            </div>
          )}

          <button type="submit" className="upk-btn upk-btn-primary" style={{ width: "100%" }}>
            Send the request
          </button>
        </Form>
      </div>
    </Container>
  );
}

export default function AssistanceRequest() {
  return (
    <AppLayout>
      <AssistanceRequestContent />
    </AppLayout>
  );
}