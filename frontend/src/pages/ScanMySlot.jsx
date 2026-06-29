import { useEffect, useRef, useState } from "react";
import { Container, Card, CardBody, Alert, Button } from "reactstrap";
import { Html5Qrcode } from "html5-qrcode";
import axiosClient from "../api/axiosClient";
import SessionGate from "./SessionGate";
import AppLayout from "../components/AppLayout";
import "../upark.css";

function ScanMySlotContent() {
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  const startScan = async () => {
    setResult(null);
    setScanning(true);

    const scanner = new Html5Qrcode("slot-scanner-view");
    scannerRef.current = scanner;

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setScanning(false);
        setResult({ type: "error", message: "No camera detected on this device." });
        return;
      }

      const rearCamera = cameras.find((c) => /back|rear|environment/i.test(c.label));
      const cameraId = rearCamera ? rearCamera.id : cameras[0].id;

      await scanner.start(
        cameraId,
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);
          submitSlotToken(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      setResult({ type: "error", message: "Unable to access camera: " + (err?.message || err) });
    }
  };

  const submitSlotToken = (slotToken) => {
    axiosClient
      .post("/Session/scan-slot/mine", { slotToken })
      .then((res) => {
        const label = res.data.status === "late_scan" ? "Scanned (late)" : "Slot confirmed";
        setResult({ type: "success", message: `${label}: ${res.data.slotNumber}` });
      })
      .catch((err) => {
        setResult({ type: "error", message: err.response?.data?.message || "Scan error." });
      });
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <Container style={{ maxWidth: "480px", paddingTop: "24px", paddingBottom: "40px" }}>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#02457A" }}>
        Scan my slot
      </h3>
      <p style={{ color: "#4a5568", marginBottom: "20px" }}>
        Point the camera at the QR code posted on the slot where you are parked.
      </p>

      <Card className="upk-card">
        <CardBody className="text-center">
          <div id="slot-scanner-view" style={{ width: "100%", minHeight: "260px" }} />

          {!scanning && (
            <Button color="primary" className="mt-3" onClick={startScan} style={{ background: "#02457A", border: "none" }}>
              Start scanning
            </Button>
          )}

          {result && (
            <Alert color={result.type === "success" ? "success" : "danger"} className="mt-3 mb-0">
              {result.message}
            </Alert>
          )}
        </CardBody>
      </Card>
    </Container>
  );
}

export default function ScanMySlot() {
  return (
    <AppLayout>
      <SessionGate>
        <ScanMySlotContent />
      </SessionGate>
    </AppLayout>
  );
}