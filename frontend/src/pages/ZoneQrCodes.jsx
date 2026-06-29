import { useState, useEffect } from "react";
import { Container, Card, CardBody, Button } from "reactstrap";
import { QRCodeSVG } from "qrcode.react";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

export default function ZoneQrCodes() {
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    axiosClient.get("/Parking/areas/tokens").then((res) => setAreas(res.data));
  }, []);

  return (
    <AppLayout>
      <Container style={{ paddingTop: "24px", paddingBottom: "40px" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#02457A" }}>
            Zone QR Codes (worker check-in)
          </h3>
          <Button color="primary" onClick={() => window.print()} style={{ background: "#02457A", border: "none" }}>
            Print
          </Button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
          {areas.map((area) => (
            <Card key={area.id} className="upk-card">
              <CardBody className="text-center p-3">
                <QRCodeSVG value={area.areaToken} size={140} />
                <p className="mb-0 mt-2"><strong>{area.areaName}</strong></p>
              </CardBody>
            </Card>
          ))}
        </div>
      </Container>
    </AppLayout>
  );
}