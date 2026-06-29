import { Container, Card, CardBody } from "reactstrap";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const sectionLabelStyle = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "#4a5568",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
  marginBottom: "10px",
  display: "block",
};

export default function Rules() {
  return (
    <AppLayout>
      <Container style={{ maxWidth: "700px", paddingTop: "24px", paddingBottom: "40px" }}>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#02457A" }}>Parking Regulations</h3>
        <p style={{ color: "#4a5568", marginBottom: "28px" }}>
          Everything you need to know to use the parking lot without receiving a violation.
        </p>

        <Card className="mb-4 upk-card">
          <CardBody style={{ padding: "24px" }}>
            <span style={sectionLabelStyle}>Entry and exit</span>
            <ul style={{ paddingLeft: "20px", color: "#10172a", lineHeight: 1.7 }}>
              <li>Scan your personal QR code at the gate for every entry and exit.</li>
              <li>You cannot enter a second time without scanning your exit first.</li>
              <li>If your account is blocked (100+ points), the gate will deny entry.</li>
            </ul>
          </CardBody>
        </Card>

        <Card className="mb-4 upk-card">
          <CardBody style={{ padding: "24px" }}>
            <span style={sectionLabelStyle}>Scanning your slot</span>
            <ul style={{ paddingLeft: "20px", color: "#10172a", lineHeight: 1.7 }}>
              <li>
                After entry, you have <strong>15 minutes</strong> before a notification reminder.
              </li>
              <li>
                You have <strong>40 minutes</strong> total after entry to scan a slot.
                Beyond that, you automatically receive a <strong>+20 points</strong> violation.
              </li>
              <li>
                If you scan a slot that is not yours (another student's reservation or wrong slot),
                you have <strong>15 minutes</strong> to correct it (move your car and scan the correct slot)
                before receiving a <strong>+20 points</strong> violation.
              </li>
            </ul>
          </CardBody>
        </Card>

        <Card className="mb-4 upk-card">
          <CardBody style={{ padding: "24px" }}>
            <span style={sectionLabelStyle}>Reservations</span>
            <ul style={{ paddingLeft: "20px", color: "#10172a", lineHeight: 1.7 }}>
              <li>You can have only one active reservation at a time.</li>
              <li>
                If you don't show up within <strong>30 minutes</strong> of the scheduled time,
                your reservation expires and the slot is released.
              </li>
              <li>A canceled or expired reservation releases the slot for the waiting list.</li>
            </ul>
          </CardBody>
        </Card>

        <Card className="mb-4 upk-card">
          <CardBody style={{ padding: "24px" }}>
            <span style={sectionLabelStyle}>Waiting list</span>
            <ul style={{ paddingLeft: "20px", color: "#10172a", lineHeight: 1.7 }}>
              <li>If the parking lot is full, you can join the waiting list for a given time.</li>
              <li>
                Priority is given to the closest requested time, not registration order.
              </li>
              <li>
                In case of a tie on the requested time, the earliest registration is prioritized.
              </li>
            </ul>
          </CardBody>
        </Card>

        <Card className="mb-4 upk-card">
          <CardBody style={{ padding: "24px" }}>
            <span style={sectionLabelStyle}>Violation points</span>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <tbody>
                {[
                  ["Bad parking", "+10"],
                  ["Very bad parking", "+20"],
                  ["No slot scan within time limit", "+20"],
                  ["Accident", "+20"],
                  ["Wrong slot not corrected", "+20"],
                ].map(([label, pts]) => (
                  <tr key={label} style={{ borderBottom: "1px solid #F1F3F8" }}>
                    <td style={{ padding: "10px 0", color: "#10172a" }}>{label}</td>
                    <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: "#C62828" }}>
                      {pts} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: "16px", marginBottom: 0, color: "#10172a" }}>
              If your total reaches <strong>100 points or more</strong>, your account is automatically{" "}
              <strong style={{ color: "#C62828" }}>blocked</strong>. You will not be able to enter the
              parking lot until an admin unblocks you.
            </p>
          </CardBody>
        </Card>

        <Card className="upk-card">
          <CardBody style={{ padding: "24px" }}>
            <span style={sectionLabelStyle}>Assistance requests</span>
            <ul style={{ paddingLeft: "20px", color: "#10172a", lineHeight: 1.7 }}>
              <li>
                You can request help at any time from your dashboard: parking help, accident,
                security issue, car problem, or other.
              </li>
              <li>A worker in your zone will be notified and can accept your request.</li>
              <li>
                You can track the status of your request (pending, in progress, resolved) in "My session".
              </li>
            </ul>
          </CardBody>
        </Card>
      </Container>
    </AppLayout>
  );
}