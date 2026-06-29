import { useEffect, useState } from "react";
import { Card, CardBody, Button } from "reactstrap";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function SessionGate({ children }) {
  const [hasActiveSession, setHasActiveSession] = useState(null);

  useEffect(() => {
    axiosClient
      .get("/Session/mine")
      .then((res) => setHasActiveSession(res.data.status !== "left"))
      .catch(() => setHasActiveSession(false));
  }, []);

  if (hasActiveSession === null) {
    return null;
  }

  if (!hasActiveSession) {
    return (
      <Card style={{ borderRadius: "12px", maxWidth: "500px", margin: "60px auto" }}>
        <CardBody className="text-center">
          <h5 style={{ color: "#ef4444", fontFamily: "'Space Grotesk', sans-serif" }}>
            You haven't entered the parking yet
          </h5>
          <p style={{ color: "#4a5568" }}>
            This page is only available once your entry has been scanned at the gate.
          </p>
          <Link to="/dashboard">
            <Button color="primary">Back to Dashboard</Button>
          </Link>
        </CardBody>
      </Card>
    );
  }

  return children;
}