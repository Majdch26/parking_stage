import { useState, useEffect, useRef } from "react";
import { Container, Card, CardBody, Spinner, Badge, Button } from "reactstrap";
import { QRCodeSVG } from "qrcode.react";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

export default function Profile() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const qrRef = useRef(null);

  const handleDownloadQr = () => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const scale = 4;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "my-parking-qr-code.png";
        link.click();
        URL.revokeObjectURL(link.href);
      });
    };
    img.src = url;
  };

  useEffect(() => {
    axiosClient
      .get("/Auth/me")
      .then((res) => setMe(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load profile.")
      );
  }, []);

  if (error) {
    return (
      <AppLayout>
        <Container style={{ paddingTop: "24px" }}>
          <p style={{ color: "red" }}>{error}</p>
        </Container>
      </AppLayout>
    );
  }

  if (!me) {
    return (
      <AppLayout>
        <Container style={{ paddingTop: "24px", textAlign: "center" }}>
          <Spinner color="primary" />
        </Container>
      </AppLayout>
    );
  }

  const isStudent = me.role?.toLowerCase() === "student";
  const isBlocked = me.status?.toLowerCase() === "blocked";

  return (
    <AppLayout>
      <Container style={{ maxWidth: "550px", paddingTop: "24px", paddingBottom: "40px" }}>
        <Card className="upk-card">
          <CardBody className="text-center p-4">
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#02457A" }}>
              {me.firstName} {me.lastName}
            </h3>
            <p style={{ color: "#4a5568", marginBottom: "20px" }}>{me.email}</p>

            <div className="d-flex justify-content-center gap-2 mb-4">
              <Badge className="upk-pill-info" pill>
                {me.role?.charAt(0).toUpperCase() + me.role?.slice(1)}
              </Badge>
              {isStudent && (
                <Badge className={isBlocked ? "upk-pill-danger" : "upk-pill-success"} pill>
                  {isBlocked ? "Blocked" : "Active"}
                </Badge>
              )}
            </div>

            {isStudent && (
              <>
                <div className="mb-4">
                  <strong>Violation points: </strong>
                  <span style={{ color: me.points >= 100 ? "#C8313D" : me.points >= 50 ? "#B9790A" : "#0E9D6B", fontWeight: 700 }}>
                    {me.points} / 100
                  </span>
                </div>

                {me.qrToken ? (
                  <div
                    ref={qrRef}
                    style={{
                      display: "inline-block",
                      padding: "16px",
                      background: "white",
                      border: "1px solid #e3e7f0",
                      borderRadius: "12px",
                    }}
                  >
                    <QRCodeSVG value={me.qrToken} size={180} />
                  </div>
                ) : (
                  <p style={{ color: "#4a5568" }}>No QR code available.</p>
                )}

                {me.qrToken && (
                  <div className="mt-2">
                    <Button color="secondary" outline size="sm" onClick={handleDownloadQr}>
                      Download my QR code
                    </Button>
                  </div>
                )}

                <p style={{ fontSize: "0.8rem", color: "#4a5568", marginTop: "12px" }}>
                  Scan this code at the parking entrance.
                </p>
              </>
            )}

            {!isStudent && (
              <p style={{ color: "#4a5568" }}>
                {me.role === "worker" ? "Worker" : "Administrator"} account — access to parking management tools.
              </p>
            )}
          </CardBody>
        </Card>
      </Container>
    </AppLayout>
  );
}