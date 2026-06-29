import { useEffect, useRef, useState } from "react";
import { Container, Card, CardBody, Alert, Button, Badge, ButtonGroup } from "reactstrap";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

function GateScannerContent() {
  const [mode, setMode] = useState("entry");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const scannerRef = useRef(null);

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch {}
  };

  useEffect(() => () => { stopScanner(); }, []);

  const startScan = async () => {
    setResult(null);
    setScanning(true);

    const scanner = new Html5Qrcode("gate-scanner-view");
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
          await stopScanner();
          setScanning(false);
          submitToken(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      setResult({ type: "error", message: "Unable to access camera: " + (err?.message || err) });
    }
  };

  const handleStopScan = async () => {
    await stopScanner();
    setScanning(false);
  };

  const submitToken = (qrToken) => {
    const endpoint = mode === "entry" ? "/Session/entry" : "/Session/exit";
    axiosClient
      .post(endpoint, { QrToken: qrToken })
      .then((res) => {
        if (mode === "entry") {
          const r = res.data;
          setResult({
            type: "success",
            message: r.hasReservation
              ? `Entry OK -- reserved slot (slot #${r.reservedSlotId}). Scan the slot before ${new Date(r.slotScanDeadline).toLocaleTimeString("en-US")}.`
              : `Entry OK -- no reservation. Scan the slot before ${new Date(r.slotScanDeadline).toLocaleTimeString("en-US")}.`,
          });
        } else {
          setResult({ type: "success", message: "Exit recorded successfully." });
        }
      })
      .catch((err) => {
        setResult({ type: "error", message: err.response?.data?.message || "Scan error." });
      });
  };

  return (
    <Container style={{ maxWidth: "550px", paddingTop: "24px", paddingBottom: "40px" }}>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#02457A" }}>
        Gate — Entry / Exit Scanner
      </h3>
      <p style={{ color: "#4a5568", marginBottom: "20px" }}>
        Scan the student's QR code to record entry or exit.
      </p>

      <ButtonGroup className="mb-3 w-100">
        <Button
          color={mode === "entry" ? "primary" : "secondary"}
          outline={mode !== "entry"}
          onClick={() => { setMode("entry"); setResult(null); }}
          style={mode === "entry" ? { background: "#02457A", border: "none" } : {}}
        >
          Entry
        </Button>
        <Button
          color={mode === "exit" ? "primary" : "secondary"}
          outline={mode !== "exit"}
          onClick={() => { setMode("exit"); setResult(null); }}
          style={mode === "exit" ? { background: "#02457A", border: "none" } : {}}
        >
          Exit
        </Button>
      </ButtonGroup>

      <Card className="upk-card mb-4">
        <CardBody className="text-center">
          <Badge color={mode === "entry" ? "success" : "warning"} className="mb-3">
            Mode: {mode === "entry" ? "ENTRY" : "EXIT"}
          </Badge>

          <div id="gate-scanner-view" style={{ width: "100%", minHeight: "260px" }} />

          {!scanning ? (
            <Button color="primary" className="mt-3" onClick={startScan} style={{ background: "#02457A", border: "none" }}>
              Scan student QR
            </Button>
          ) : (
            <Button color="secondary" className="mt-3" onClick={handleStopScan}>
              Stop scanning
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

function RequireGateCheckIn({ children }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    axiosClient
      .get("/WorkerShift/status")
      .then((res) => {
        const { isCheckedIn, shift } = res.data;
        if (!isCheckedIn) {
          setState("not-checked-in");
        } else if ((shift?.areaName || "").trim().toLowerCase() !== "gate") {
          setState("not-gate");
        } else {
          setState("ok");
        }
      })
      .catch(() => setState("not-checked-in"));
  }, []);

  if (state === null) return null;

  if (state !== "ok") {
    return (
      <Card className="upk-card" style={{ maxWidth: "500px", margin: "60px auto" }}>
        <CardBody className="text-center">
          <h5 style={{ color: "#ef4444", fontFamily: "'Space Grotesk', sans-serif" }}>
            Access Denied
          </h5>
          <p style={{ color: "#4a5568" }}>
            {state === "not-checked-in"
              ? "You must be on duty to access the gate scanner."
              : "This page is only accessible to workers checked in to the 'gate' zone."}
          </p>
          <Link to="/worker/check-in" className="btn btn-primary" style={{ background: "#02457A", border: "none" }}>
            Go to Check-in
          </Link>
        </CardBody>
      </Card>
    );
  }

  return children;
}

export default function GateSimulator() {
  return (
    <AppLayout>
      <RequireGateCheckIn>
        <GateScannerContent />
      </RequireGateCheckIn>
    </AppLayout>
  );
}