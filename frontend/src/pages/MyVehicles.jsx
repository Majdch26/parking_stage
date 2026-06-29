import { useState, useEffect } from "react";
import { Container, Card, CardBody, Spinner } from "reactstrap";
import { Car, Plus } from "lucide-react";
import VehicleForm from "../components/VehicleForm";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

function MyVehiclesContent() {
  const [vehicles, setVehicles] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const loadVehicles = () => {
    axiosClient
      .get("/Vehicle/mine")
      .then((res) => setVehicles(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Impossible de charger les véhicules.")
      );
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleAdded = () => {
    setShowForm(false);
    loadVehicles();
  };

  return (
    <Container style={{ maxWidth: "760px", paddingTop: "24px", paddingBottom: "48px" }}>
      <div className="upk-banner">
        <div className="upk-banner-row">
          <div>
            <div className="upk-eyebrow">Garage</div>
            <h1>My vehicles</h1>
            <p>Manage the cars registered to your account.</p>
          </div>
          <div className="upk-banner-icon">
            <Car size={22} color="#fff" />
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="upk-label" style={{ marginBottom: 0 }}>
          {vehicles ? `${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"}` : "Loading"}
        </span>
        {!showForm && (
          <button className="upk-btn upk-btn-primary" onClick={() => setShowForm(true)}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Plus size={15} /> Add a vehicle
            </span>
          </button>
        )}
      </div>

      {error && <p style={{ color: "#ef4444" }}>{error}</p>}

      {showForm && (
        <Card className="upk-card mb-4" style={{ border: "1.5px dashed #e3e7f0" }}>
          <CardBody style={{ padding: "24px" }}>
            <VehicleForm onSuccess={handleAdded} onCancel={() => setShowForm(false)} />
          </CardBody>
        </Card>
      )}

      {vehicles === null ? (
        <Spinner color="primary" />
      ) : vehicles.length === 0 ? (
        <div className="upk-card upk-card-pad text-center" style={{ color: "#8a94a6" }}>
          No vehicle registered yet — add your first one above.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: "16px",
          }}
        >
          {vehicles.map((v) => (
            <div key={v.id} className="upk-vehicle-card">
              {v.isPrimary && <span className="upk-vehicle-primary-flag">Primary</span>}

              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "#eef1f7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Car size={30} color="#3b82f6" />
              </div>

              <div>
                <div style={{ fontFamily: "var(--upk-font-display)", fontWeight: 700, fontSize: "0.98rem", color: "#10172a" }}>
                  {v.brandName} {v.modelName}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#4a5568", marginTop: 4 }}>
                  {v.vehicleTypeName}
                  {v.color ? ` · ${v.color}` : ""}
                  {v.year ? ` · ${v.year}` : ""}
                </div>
              </div>

              <span className="upk-plate">{v.plateNumber}</span>

              <span className={`upk-pill ${v.status === "active" ? "green" : "slate"}`}>
                <span className="dot" />
                {v.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}

export default function MyVehicles() {
  return (
    <AppLayout>
      <MyVehiclesContent />
    </AppLayout>
  );
}