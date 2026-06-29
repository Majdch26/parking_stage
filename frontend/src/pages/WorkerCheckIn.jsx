import { useEffect, useRef, useState } from "react";
import { Container, Card, CardBody, Alert, Button, Badge } from "reactstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const SHIFT_LIMIT_MS = 7 * 60 * 60 * 1000;

export default function WorkerCheckIn() {
  const location = useLocation();
  const navigate = useNavigate();

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [currentShift, setCurrentShift] = useState(undefined);
  const [elapsed, setElapsed] = useState(0);
  const [alarmFired, setAlarmFired] = useState(false);
  const scannerRef = useRef(null);

  const loadStatus = () => {
    axiosClient
      .get("/WorkerShift/mine")
      .then((res) => setCurrentShift(res.data.find((s) => !s.checkOutTime) || null))
      .catch(() => setCurrentShift(null));
  };

  useEffect(() => { loadStatus(); }, []);

  useEffect(() => {
    const areaId = location.state?.areaId;
    if (areaId && currentShift === null) {
      checkInToArea(areaId);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, currentShift]);

  const checkInToArea = (areaId) => {
    setResult(null);
    axiosClient
      .post("/WorkerShift/check-in", { areaId })
      .then(() => {
        setResult({ type: "success", message: "Check-in successful." });
        loadStatus();
      })
      .catch((err) => {
        setResult({ type: "error", message: err.response?.data?.message || "Error during check-in." });
      });
  };

  useEffect(() => {
    if (!currentShift) {
      setElapsed(0);
      setAlarmFired(false);
      return;
    }
    const start = new Date(currentShift.checkInTime).getTime();
    const tick = () => {
      const diff = Date.now() - start;
      setElapsed(diff);
      if (diff >= SHIFT_LIMIT_MS && !alarmFired) {
        setAlarmFired(true);
        try {
          window.alert("⏰ Your 7-hour shift is over. Remember to check out!");
        } catch {}
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentShift?.checkInTime, alarmFired]);

  const fmtElapsed = (ms) => {
    const totalMinutes = Math.floor(ms / 60000);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${String(m).padStart(2, "0")}min`;
  };

  const startScan = async () => {
    setResult(null);
    setScanning(true);

    const scanner = new Html5Qrcode("zone-scanner-view");
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
          submitAreaToken(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      setResult({ type: "error", message: "Unable to access camera: " + (err?.message || err) });
    }
  };

  const submitAreaToken = (areaToken) => {
    axiosClient
      .post("/WorkerShift/check-in/scan", { areaToken })
      .then(() => {
        setResult({ type: "success", message: "Check-in successful." });
        loadStatus();
      })
      .catch((err) => {
        setResult({ type: "error", message: err.response?.data?.message || "Error during check-in." });
      });
  };

  const handleCheckOut = () => {
    setResult(null);
    axiosClient
      .post("/WorkerShift/check-out")
      .then(() => {
        setResult({ type: "success", message: "Check-out successful." });
        loadStatus();
      })
      .catch((err) => {
        setResult({ type: "error", message: err.response?.data?.message || "Error during check-out." });
      });
  };

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleString("en-US", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
      : "—";

  return (
    <AppLayout>
      <Container style={{ maxWidth: "550px", paddingTop: "24px", paddingBottom: "40px" }}>
        <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#02457A" }}>Check-in / Check-out</h3>
        <p style={{ color: "#6B7280", marginBottom: "20px" }}>
          Scan the QR posted in your zone, or come back from the dashboard by clicking "Reserve this zone".
        </p>

        <Card className="upk-card mb-4">
          <CardBody className="text-center">
            {currentShift === undefined ? (
              <p style={{ color: "#6B7280" }}>Loading...</p>
            ) : currentShift ? (
              <>
                <Badge color={elapsed >= SHIFT_LIMIT_MS ? "danger" : "success"} className="mb-2" style={{ background: elapsed >= SHIFT_LIMIT_MS ? "#dc3545" : "#02457A" }}>
                  On duty — {currentShift.areaName}
                </Badge>
                <p className="mb-1" style={{ color: "#6B7280" }}>
                  Since {fmt(currentShift.checkInTime)}
                </p>
                <p className="mb-3" style={{ color: elapsed >= SHIFT_LIMIT_MS ? "#dc3545" : "#6B7280", fontWeight: 600 }}>
                  Shift time: {fmtElapsed(elapsed)} / 7h00
                  {elapsed >= SHIFT_LIMIT_MS && " — Shift over, check-out recommended!"}
                </p>
                <Button color="danger" onClick={handleCheckOut} style={{ background: "#dc3545", border: "none" }}>Check-out</Button>
              </>
            ) : (
              <>
                <div id="zone-scanner-view" style={{ width: "100%", minHeight: "260px" }} />
                {!scanning && (
                  <Button color="primary" className="mt-3" onClick={startScan} style={{ background: "#02457A", border: "none" }}>
                    Scan zone QR
                  </Button>
                )}
              </>
            )}

            {result && (
              <Alert color={result.type === "success" ? "success" : "danger"} className="mt-3 mb-0">
                {result.message}
              </Alert>
            )}
          </CardBody>
        </Card>
      </Container>
    </AppLayout>
  );
}