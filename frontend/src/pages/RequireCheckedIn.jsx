import { useEffect, useState } from "react";
import { Card, CardBody, Button } from "reactstrap";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function RequireCheckedIn({ children }) {
  const [checkedIn, setCheckedIn] = useState(null);

  useEffect(() => {
    axiosClient
      .get("/WorkerShift/status")
      .then((res) => setCheckedIn(!!res.data.isCheckedIn))
      .catch(() => setCheckedIn(false));
  }, []);

  if (checkedIn === null) {
    return null;
  }

  if (!checkedIn) {
    return (
      <Card style={{ borderRadius: "12px", maxWidth: "500px", margin: "60px auto" }}>
        <CardBody className="text-center">
          <h5 style={{ color: "#ef4444", fontFamily: "'Space Grotesk', sans-serif" }}>
            Check-in d'abord !
          </h5>
          <p style={{ color: "#4a5568" }}>
            Tu dois être en poste (check-in sur une zone) pour accéder à cette page.
          </p>
          <Link to="/worker/check-in">
            <Button color="primary">Aller au check-in</Button>
          </Link>
        </CardBody>
      </Card>
    );
  }

  return children;
}