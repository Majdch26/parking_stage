import { useEffect, useState } from "react";
import { Container, Card, CardBody, Badge } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

export default function WorkerZones() {
  const [zones, setZones] = useState(null);

  const load = () => {
    axiosClient.get("/WorkerShift/zones").then((res) => setZones(res.data)).catch(() => setZones([]));
  };

  useEffect(() => { load(); }, []);

  if (zones === null) {
    return (
      <AppLayout>
        <Container style={{ paddingTop: "24px" }}>
          <p style={{ color: "#6B7280" }}>Loading...</p>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container style={{ maxWidth: "650px", paddingTop: "24px", paddingBottom: "40px" }}>
        <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#02457A" }}>Available zones</h3>
        <p style={{ color: "#6B7280", marginBottom: "20px" }}>
          To cover a zone, scan the QR posted in that zone from the Check-in page.
        </p>

        {zones.length === 0 ? (
          <Card className="upk-card">
            <CardBody>
              <p style={{ color: "#6B7280", margin: 0 }}>No zones configured.</p>
            </CardBody>
          </Card>
        ) : (
          zones.map((z) => (
            <Card key={z.areaId} className="mb-2 upk-card">
              <CardBody className="d-flex justify-content-between align-items-center">
                <strong style={{ color: "#11163D" }}>{z.areaName}</strong>
                <Badge className={z.isCovered ? "upk-pill-neutral" : "upk-pill-success"} pill>
                  {z.isCovered ? "Covered" : "Available"}
                </Badge>
              </CardBody>
            </Card>
          ))
        )}
      </Container>
    </AppLayout>
  );
}