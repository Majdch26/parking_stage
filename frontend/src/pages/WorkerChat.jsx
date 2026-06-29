import { useEffect, useRef, useState, useCallback } from "react";
import { Container, Card, CardBody, Input, Button, Alert, Spinner } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const POLL_INTERVAL_MS = 5000;

export default function WorkerChat() {
  const [messages, setMessages] = useState(null); // null = loading, [] = empty
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);
  const lastIdRef = useRef(0);
  const myUserId = Number(localStorage.getItem("userId"));
  const intervalRef = useRef(null);

  // Vérifier que l'utilisateur est bien identifié
  if (!myUserId) {
    console.warn("WorkerChat: userId not found in localStorage");
  }

  // Scroll en bas quand les messages changent
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fonction pour récupérer les messages depuis un ID donné
  const fetchMessagesSince = useCallback(async (sinceId) => {
    try {
      const res = await axiosClient.get(`/WorkerChat/messages/since/${sinceId}`);
      return res.data;
    } catch (err) {
      console.error("fetchMessagesSince error:", err);
      throw err;
    }
  }, []);

  // Chargement initial
  const loadInitialMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMessagesSince(0);
      setMessages(data);
      if (data.length > 0) {
        lastIdRef.current = data[data.length - 1].id;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Unknown error";
      setError(`Failed to load messages: ${msg}`);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [fetchMessagesSince]);

  // Polling pour les nouveaux messages
  const pollNewMessages = useCallback(async () => {
    try {
      const data = await fetchMessagesSince(lastIdRef.current);
      if (data.length > 0) {
        setMessages((prev) => [...(prev || []), ...data]);
        lastIdRef.current = data[data.length - 1].id;
      }
    } catch (err) {
      // On ne modifie pas l'état d'erreur ici pour ne pas perturber l'utilisateur,
      // mais on logue l'erreur
      console.warn("Polling error:", err.message);
    }
  }, [fetchMessagesSince]);

  // Initialisation et polling
  useEffect(() => {
    loadInitialMessages();

    // Nettoyer l'ancien intervalle
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Démarrer le polling après le chargement initial
    intervalRef.current = setInterval(pollNewMessages, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadInitialMessages, pollNewMessages]);

  // Envoyer un message
  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    try {
      await axiosClient.post("/WorkerChat/messages", { message: text });
      setDraft("");

      // Récupérer les nouveaux messages (incluant celui qu'on vient d'envoyer)
      const newData = await fetchMessagesSince(lastIdRef.current);
      if (newData.length > 0) {
        setMessages((prev) => [...(prev || []), ...newData]);
        lastIdRef.current = newData[newData.length - 1].id;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Unknown error";
      setError(`Error sending message: ${msg}`);
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  // Rafraîchir manuellement
  const handleRefresh = () => {
    loadInitialMessages();
  };

  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  // Affichage du chargement
  if (loading) {
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
              {messages?.length === 0 ? (
                <p style={{ color: "#6B7280", textAlign: "center", marginTop: "20px" }}>
                  No messages yet. Be the first to write!
                </p>
              ) : (
                messages?.map((m) => {
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