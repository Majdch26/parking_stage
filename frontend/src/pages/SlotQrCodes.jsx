import { useState, useEffect } from "react";
import { Container, Card, CardBody, Button } from "reactstrap";
import { QRCodeSVG } from "qrcode.react";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
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

export default function SlotQrCodes() {
  const [areas, setAreas] = useState([]);
  const [slotsByArea, setSlotsByArea] = useState({});

  useEffect(() => {
    axiosClient.get("/Parking/areas").then(async (res) => {
      setAreas(res.data);
      const map = {};
      for (const area of res.data) {
        const slotsRes = await axiosClient.get(`/Parking/areas/${area.id}/slots/tokens`);
        map[area.id] = [...slotsRes.data].sort(naturalSort);
      }
      setSlotsByArea(map);
    });
  }, []);

  return (
    <AppLayout>
      <Container style={{ paddingTop: "24px", paddingBottom: "40px" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#02457A" }}>
            Slot QR Codes (testing / printing)
          </h3>
          <Button color="primary" onClick={() => window.print()} style={{ background: "#02457A", border: "none" }}>
            Print
          </Button>
        </div>

        {areas.map((area) => (
          <div key={area.id} className="mb-4">
            <h5 style={{ color: "#02457A", fontFamily: "'Space Grotesk', sans-serif" }}>{area.areaName}</h5>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
              {(slotsByArea[area.id] || []).map((slot) => (
                <Card key={slot.id} className="upk-card">
                  <CardBody className="text-center p-3">
                    <QRCodeSVG value={slot.slotToken} size={120} />
                    <p className="mb-0 mt-2"><strong>{slot.slotNumber}</strong></p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </Container>
    </AppLayout>
  );
}