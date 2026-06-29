import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import axiosClient from "../api/axiosClient";

export default function ChatBox() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hello! Need a quick answer? Ask your question here." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { from: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axiosClient.post("/Chat/ask", { message: trimmed });
      setMessages((prev) => [...prev, { from: "bot", text: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: err.response?.data?.message || "Sorry, the assistant couldn't respond. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  return (
    <>
      <style>{`
        @keyframes upark-chat-pulse {
          0% { box-shadow: 0 0 0 0 rgba(2, 69, 122, 0.45); }
          100% { box-shadow: 0 0 0 12px rgba(2, 69, 122, 0); }
        }
      `}</style>

      <button
        onClick={() => setOpen((o) => !o)}
        className="chat-fab"
        aria-label="Open quick help"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} color="#fff" />}
      </button>

      {open && (
        <div className="chat-box-popup">
          {/* Header */}
          <div
            style={{
              background: "#02457A",
              color: "white",
              padding: "16px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 18px)",
              }}
            />
            <div
              style={{
                position: "relative",
                width: 30,
                height: 30,
                borderRadius: 9,
                background: "linear-gradient(145deg, #02457A, #018ABE)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 0 3px rgba(2, 69, 122, 0.18)",
                flexShrink: 0,
              }}
            >
              <MessageCircle size={15} color="#fff" />
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "0.92rem" }}>
                Quick Help
              </div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace" }}>
                AI assistant · live
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              background: "#eef1f7",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.from === "bot" ? "flex-start" : "flex-end",
                  maxWidth: "85%",
                  background: m.from === "bot" ? "#ffffff" : "#02457A",
                  color: m.from === "bot" ? "#10172a" : "white",
                  padding: "9px 13px",
                  borderRadius: m.from === "bot" ? "12px 12px 12px 4px" : "12px 12px 4px 12px",
                  fontSize: "0.85rem",
                  lineHeight: "1.4",
                  boxShadow: m.from === "bot" ? "0 1px 4px rgba(20,30,60,0.06)" : "0 4px 12px rgba(2, 69, 122, 0.25)",
                  whiteSpace: "pre-wrap",
                  border: m.from === "bot" ? "1px solid #e3e7f0" : "none",
                }}
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: "#ffffff",
                  padding: "9px 13px",
                  borderRadius: "12px 12px 12px 4px",
                  fontSize: "0.85rem",
                  color: "#8a94a6",
                  boxShadow: "0 1px 4px rgba(20,30,60,0.06)",
                  border: "1px solid #e3e7f0",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                thinking...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Formulaire */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              gap: "8px",
              padding: "10px",
              borderTop: "1.5px dashed #e3e7f0",
              background: "white",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your question..."
              disabled={loading}
              style={{
                flex: 1,
                border: "1px solid #e3e7f0",
                borderRadius: "30px",
                padding: "9px 14px",
                fontSize: "0.85rem",
                outline: "none",
                fontFamily: "'Inter', sans-serif",
                background: "#f8fafc",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                border: "none",
                background: "#02457A",
                color: "white",
                borderRadius: "30px",
                width: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                boxShadow: "0 4px 12px rgba(2, 69, 122, 0.3)",
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}