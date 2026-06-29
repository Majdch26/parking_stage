import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Bell, Check, X, Clock, AlertCircle, Calendar, HelpCircle, Car } from "lucide-react";
import axiosClient from "../api/axiosClient";

const TYPE_ICONS = {
  reservation: <Calendar size={16} />,
  assistance: <HelpCircle size={16} />,
  waiting_list: <Clock size={16} />,
  violation: <AlertCircle size={16} />,
  scan_reminder: <Car size={16} />,
  wrong_slot: <AlertCircle size={16} />,
};

const TYPE_LABELS = {
  reservation: "Reservation",
  assistance: "Assistance",
  waiting_list: "Waiting list",
  violation: "Violation",
  scan_reminder: "Scan reminder",
  wrong_slot: "Wrong slot",
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("unread");
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const buttonRef = useRef(null);
  const popupRef = useRef(null);
  const containerRef = useRef(null);

  const load = () => {
    axiosClient.get("/Notification/mine").then((res) => setNotifications(res.data)).catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // Gestion du clic en dehors du pop-up et du bouton
  useEffect(() => {
    const handleClickOutside = (e) => {
      const isButton = buttonRef.current && buttonRef.current.contains(e.target);
      const isPopup = popupRef.current && popupRef.current.contains(e.target);
      if (!isButton && !isPopup) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Calcul de la position du pop-up lors de l'ouverture
  const handleToggle = () => {
    if (!open) {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        setPopupPosition({
          top: rect.top - 10, // aligné avec le haut du bouton (avec un léger ajustement)
          left: rect.right + 10, // juste à droite du bouton
        });
      }
    }
    setOpen((o) => !o);
  };

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);
  const visible = tab === "unread" ? unread : read;

  const handleMarkAsRead = (id) => {
    axiosClient.patch(`/Notification/${id}/read`).then(() => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    });
  };

  const handleMarkAllAsRead = () => {
    axiosClient.patch("/Notification/read-all").then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    });
  };

  const handleGoToWaitingList = (e, notificationId) => {
    e.stopPropagation();
    handleMarkAsRead(notificationId);
    navigate("/waiting-list");
    setOpen(false);
  };

  const fmt = (d) =>
    new Date(d).toLocaleString("en-US", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  // Contenu du pop-up
  const popupContent = open && (
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        top: popupPosition.top,
        left: popupPosition.left,
        width: "360px",
        maxHeight: "460px",
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        borderRadius: "16px",
        boxShadow: "0 16px 40px rgba(0,0,0,0.15)",
        border: "1px solid #E4E9ED",
        zIndex: 9999,
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
        transformOrigin: "top left",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#02457A",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <strong style={{ color: "#FFFFFF", fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.98rem" }}>
          Notifications
        </strong>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {unread.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              title="Mark all as read"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                padding: "5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#B0D9F0",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            >
              <Check size={16} />
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              padding: "5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#CDD6F0",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "20px", padding: "0 16px", borderBottom: "1px solid #E4E9ED", background: "#F8FAFC" }}>
        <button
          onClick={() => setTab("unread")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "10px 0 9px",
            fontWeight: 700,
            fontSize: "0.82rem",
            color: tab === "unread" ? "#02457A" : "#6B7A8F",
            borderBottom: tab === "unread" ? "2px solid #02457A" : "2px solid transparent",
            transition: "color 0.2s, border-color 0.2s",
          }}
        >
          Unread {unread.length > 0 && `(${unread.length})`}
        </button>
        <button
          onClick={() => setTab("read")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "10px 0 9px",
            fontWeight: 700,
            fontSize: "0.82rem",
            color: tab === "read" ? "#02457A" : "#6B7A8F",
            borderBottom: tab === "read" ? "2px solid #02457A" : "2px solid transparent",
            transition: "color 0.2s, border-color 0.2s",
          }}
        >
          Read
        </button>
      </div>

      {/* List */}
      <div style={{ overflowY: "auto", flex: 1, padding: "4px 0" }}>
        {visible.length === 0 ? (
          <p style={{ color: "#6B7A8F", padding: "24px 16px", margin: 0, fontSize: "0.85rem", textAlign: "center" }}>
            {tab === "unread" ? "No unread notifications." : "No read notifications."}
          </p>
        ) : (
          visible.map((n) => {
            const Icon = TYPE_ICONS[n.type] || <Bell size={16} />;
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #ECF0F3",
                  cursor: n.isRead ? "default" : "pointer",
                  display: "flex",
                  gap: "12px",
                  transition: "background 0.15s",
                  background: n.isRead ? "transparent" : "#F0F6FF",
                }}
                onMouseEnter={(e) => {
                  if (!n.isRead) e.currentTarget.style.background = "#E3EDFA";
                }}
                onMouseLeave={(e) => {
                  if (!n.isRead) e.currentTarget.style.background = "#F0F6FF";
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: n.isRead ? "#F1F3F8" : "#E3EDFA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: n.isRead ? "#6B7A8F" : "#02457A",
                  }}
                >
                  {Icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "#02457A",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                    <span style={{ fontSize: "0.68rem", color: "#6B7A8F", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>
                      {fmt(n.createdAt)}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#1A2A3A", lineHeight: 1.4 }}>{n.message}</p>
                  {n.type === "waiting_list" && (
                    <button
                      onClick={(e) => handleGoToWaitingList(e, n.id)}
                      style={{
                        marginTop: "6px",
                        background: "#E3EDFA",
                        color: "#02457A",
                        border: "none",
                        borderRadius: "30px",
                        padding: "3px 14px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#D0E0F5")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#E3EDFA")}
                    >
                      Update time
                    </button>
                  )}
                </div>
                {!n.isRead && (
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#02457A",
                      flexShrink: 0,
                      marginTop: "8px",
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Bouton cloche */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        title="Notifications"
        aria-label="Notifications"
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          color: "#CCD4DE",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ECEEF0")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#CCD4DE")}
      >
        <Bell size={20} />
        {unread.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#EF4444",
              color: "white",
              fontSize: "0.6rem",
              fontWeight: 700,
              borderRadius: "50%",
              minWidth: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxShadow: "0 0 0 2px #323954",
              lineHeight: 1,
            }}
          >
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {/* Pop-up rendu via un portail dans le body */}
      {createPortal(popupContent, document.body)}
    </div>
  );
}