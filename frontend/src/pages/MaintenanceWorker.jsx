import { useEffect, useState } from "react";
import { Container, Card, CardBody, Badge, Button } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const STATUS_LABELS = { available: "Available", occupied: "Occupied", reserved: "Reserved", maintenance: "Maintenance" };
const STATUS_COLORS = { available: "success", occupied: "secondary", reserved: "warning", maintenance: "danger" };

export default function MaintenanceWorker() {
  const [areas, setAreas] = useState(null);
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    axiosClient.get("/Parking/areas").then((res) => {
      setAreas(res.data);
      if (res.data.length > 0) {
        const zoneA = res.data.find((a) => a.areaName === "Zone A");
        setSelectedAreaId((zoneA || res.data[0]).id);
      }
    }).catch(() => setAreas([]));
  }, []);

  const loadSlots = (areaId) => {
    axiosClient.get(`/Parking/areas/${areaId}/slots/map`).then((res) => setSlots(res.data)).catch(() => setSlots([]));
  };

  useEffect(() => {
    if (selectedAreaId) loadSlots(selectedAreaId);
  }, [selectedAreaId]);

  const toggleMaintenance = (slot) => {
    setError("");
    setBusyId(slot.id);
    const goingIntoMaintenance = slot.status !== "maintenance";
    const url = goingIntoMaintenance
      ? `/Parking/slots/${slot.id}/maintenance`
      : `/Parking/slots/${slot.id}/available`;

    axiosClient
      .patch(url)
      .then(() => loadSlots(selectedAreaId))
      .catch((err) => setError(err.response?.data?.message || "Update failed."))
      .finally(() => setBusyId(null));
  };

  return (
    <AppLayout>
      <Container style={{ maxWidth: "700px", paddingTop: "24px", paddingBottom: "40px" }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, color: "#02457A" }}>Slot Maintenance</h3>
        <p style={{ color: "#4a5568", marginBottom: "16px" }}>
          Mark an available slot as maintenance if damaged, then restore it once repaired.
          Occupied or reserved slots cannot be toggled directly.
        </p>

        {areas === null ? (
          <p style={{ color: "#4a5568" }}>Loading zones...</p>
        ) : (
          <div className="d-flex gap-2 mb-3 flex-wrap">
            {areas.map((a) => (
              <Button
                key={a.id}
                size="sm"
                color={selectedAreaId === a.id ? "primary" : "secondary"}
                outline={selectedAreaId !== a.id}
                onClick={() => setSelectedAreaId(a.id)}
                style={selectedAreaId === a.id ? { background: "#02457A", border: "none" } : {}}
              >
                {a.areaName}
              </Button>
            ))}
          </div>
        )}

        {error && <p style={{ color: "#ef4444" }}>{error}</p>}

        {slots === null ? (
          <p style={{ color: "#4a5568" }}>Loading slots...</p>
        ) : (
          <Card className="upk-card">
            <CardBody style={{ padding: "12px" }}>
              {slots.map((s) => {
                const canToggleOff = s.status === "available";
                const canToggleOn = s.status === "maintenance";
                return (
                  <div
                    key={s.id}
                    className="d-flex justify-content-between align-items-center"
                    style={{ padding: "10px 12px", borderRadius: "8px", marginBottom: "4px" }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <strong style={{ color: "#10172a" }}>{s.slotNumber}</strong>
                      <Badge color={STATUS_COLORS[s.status]}>{STATUS_LABELS[s.status] || s.status}</Badge>
                    </div>
                    {(canToggleOff || canToggleOn) && (
                      <Button
                        size="sm"
                        color={canToggleOn ? "success" : "danger"}
                        outline
                        disabled={busyId === s.id}
                        onClick={() => toggleMaintenance(s)}
                      >
                        {canToggleOn ? "Restore" : "Maintenance"}
                      </Button>
                    )}
                  </div>
                );
              })}
              {slots.length === 0 && (
                <p style={{ color: "#4a5568", textAlign: "center", margin: "12px 0" }}>No slots in this zone.</p>
              )}
            </CardBody>
          </Card>
        )}
      </Container>
    </AppLayout>
  );
}