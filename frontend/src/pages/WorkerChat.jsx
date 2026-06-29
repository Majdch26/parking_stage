import { useEffect, useRef, useState } from "react";
import { Container, Card, CardBody, Input, Button } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const POLL_INTERVAL_MS = 4000;

export default function WorkerChat() {
  const [messages, setMessages] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const lastIdRef = useRef(0);
  const myUserId = Number(localStorage.getItem("userId"));

  useEffect(() => {
    axiosClient
      .get("/WorkerChat/messages")
      .then((res) => {
        setMessages(res.data);
        if (res.data.length > 0) {
          lastIdRef.current = res.data[res.data.length - 1].id;
        }
      })
      .catch(() => setMessages([]));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      axiosClient
        .get(`/WorkerChat/messages/since/${lastIdRef.current}`)
        .then((res) => {
          if (res.data.length === 0) return;
          setMessages((prev) => [...(prev || []), ...res.data]);
          lastIdRef.current = res.data[res.data.length - 1].id;
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    axiosClient
      .post("/WorkerChat/messages", { message: text })
      .then(() => {
        setDraft("");
        return axiosClient.get(`/WorkerChat/messages/since/${lastIdRef.current}`);
      })
      .then((res) => {
        if (res.data.length > 0) {
          setMessages((prev) => [...(prev || []), ...res.data]);
          lastIdRef.current = res.data[res.data.length - 1].id;
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Error while sending message.");
      })
      .finally(() => setSending(false));
  };

  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <AppLayout>
      <Container style={{ maxWidth: "650px", paddingTop: "24px", paddingBottom: "40px" }}>
        <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#02457A" }}>Worker Chat</h3>
        <p style={{ color: "#6B7280", marginBottom: "20px" }}>
          One group for all workers — visible only to workers.
        </p>

        <Card className="upk-card" style={{ borderRadius: "14px" }}>
          <CardBody style={{ padding: "16px", display: "flex", flexDirection: "column", height: "65vh" }}>
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
              {messages === null ? (
                <p style={{ color: "#6B7280" }}>Loading...</p>
              ) : messages.length === 0 ? (
                <p style={{ color: "#6B7280" }}>No messages yet. Be the first to write!</p>
              ) : (
                messages.map((m) => {
                  const isMine = m.senderId === myUserId;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent: isMine ? "flex-end" : "flex-start",
                        marginBottom: "10px",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "75%",
                          padding: "8px 12px",
                          borderRadius: "12px",
                          background: isMine ? "#02457A" : "#F1F2F6",
                          color: isMine ? "white" : "#11163D",
                        }}
                      >
                        {!isMine && (
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: "2px", opacity: 0.8 }}>
                            {m.senderName}
                          </div>
                        )}
                        <div style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>{m.message}</div>
                        <div
                          style={{
                            fontSize: "0.68rem",
                            marginTop: "4px",
                            opacity: 0.7,
                            textAlign: isMine ? "right" : "left",
                          }}
                        >
                          {fmtTime(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {error && <p style={{ color: "#dc3545", fontSize: "0.85rem", margin: "6px 0 0" }}>{error}</p>}

            <form onSubmit={handleSend} className="d-flex gap-2 mt-3">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message..."
                maxLength={1000}
                disabled={sending}
              />
              <Button color="primary" type="submit" disabled={sending || !draft.trim()} style={{ background: "#02457A", border: "none" }}>
                Send
              </Button>
            </form>
          </CardBody>
        </Card>
      </Container>
    </AppLayout>
  );
}