import { useEffect, useRef, useState, useCallback } from "react";
import { Container, Card, CardBody, Input, Button, Alert, Spinner } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const POLL_INTERVAL_MS = 4000;
const MAX_RETRIES = 3;

export default function WorkerChat() {
  const [messages, setMessages] = useState(null); // null = loading, [] = empty
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [pollingError, setPollingError] = useState(false);

  const bottomRef = useRef(null);
  const lastIdRef = useRef(0);
  const myUserId = Number(localStorage.getItem("userId"));
  const intervalRef = useRef(null);
  const retryCountRef = useRef(0);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages function
  const fetchMessages = useCallback(async (sinceId = 0) => {
    try {
      const res = await axiosClient.get(`/WorkerChat/messages/since/${sinceId}`);
      return res.data;
    } catch (err) {
      throw err;
    }
  }, []);

  // Load initial messages
  const loadInitialMessages = useCallback(async () => {
    try {
      const data = await fetchMessages(0);
      setMessages(data);
      if (data.length > 0) {
        lastIdRef.current = data[data.length - 1].id;
      }
      setPollingError(false);
      retryCountRef.current = 0;
    } catch (err) {
      setMessages([]);
      setPollingError(true);
      setError("Failed to load messages. Please refresh.");
    }
  }, [fetchMessages]);

  // Poll for new messages
  const pollNewMessages = useCallback(async () => {
    try {
      const data = await fetchMessages(lastIdRef.current);
      if (data.length > 0) {
        setMessages((prev) => [...(prev || []), ...data]);
        lastIdRef.current = data[data.length - 1].id;
      }
      setPollingError(false);
      retryCountRef.current = 0;
    } catch (err) {
      // If polling fails, we keep trying but don't show error to user each time
      // but we can set a flag if it persists
      setPollingError(true);
      // Increment retry count, maybe we can attempt to reconnect after a few failures
      retryCountRef.current += 1;
      if (retryCountRef.current >= MAX_RETRIES) {
        setError("Connection lost. Retrying...");
        // Reset retry after some time?
      }
    }
  }, [fetchMessages]);

  // Setup initial load and polling
  useEffect(() => {
    loadInitialMessages();

    // Clear any previous interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Start polling
    intervalRef.current = setInterval(pollNewMessages, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadInitialMessages, pollNewMessages]);

  // Manual refresh
  const handleRefresh = () => {
    setError("");
    loadInitialMessages();
  };

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    try {
      // Post the message
      await axiosClient.post("/WorkerChat/messages", { message: text });
      setDraft("");

      // Immediately fetch new messages since lastId
      const newData = await fetchMessages(lastIdRef.current);
      if (newData.length > 0) {
        setMessages((prev) => [...(prev || []), ...newData]);
        lastIdRef.current = newData[newData.length - 1].id;
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error sending message.");
    } finally {
      setSending(false);
    }
  };

  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  // Show loading state
  if (messages === null) {
    return (
      <AppLayout>
        <Container style={{ maxWidth: "650px", paddingTop: "24px", textAlign: "center" }}>
          <Spinner color="primary" />
          <p style={{ marginTop: "10px", color: "#6B7280" }}>Loading chat...</p>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container style={{ maxWidth: "650px", paddingTop: "24px", paddingBottom: "40px" }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#02457A" }}>Worker Chat</h3>
          <Button color="secondary" size="sm" outline onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
        <p style={{ color: "#6B7280", marginBottom: "20px" }}>
          One group for all workers — visible only to workers.
        </p>

        {error && (
          <Alert color="danger" className="mb-3">
            {error}
            {pollingError && " (auto-reconnect in progress)"}
          </Alert>
        )}

        <Card className="upk-card" style={{ borderRadius: "14px" }}>
          <CardBody style={{ padding: "16px", display: "flex", flexDirection: "column", height: "65vh" }}>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingRight: "4px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {messages.length === 0 ? (
                <p style={{ color: "#6B7280", textAlign: "center", marginTop: "20px" }}>
                  No messages yet. Be the first to write!
                </p>
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
                          wordBreak: "break-word",
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

            <form onSubmit={handleSend} className="d-flex gap-2 mt-3">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message..."
                maxLength={1000}
                disabled={sending}
              />
              <Button
                color="primary"
                type="submit"
                disabled={sending || !draft.trim()}
                style={{ background: "#02457A", border: "none" }}
              >
                {sending ? "Sending..." : "Send"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </Container>
    </AppLayout>
  );
}