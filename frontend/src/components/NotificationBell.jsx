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

  const buttonRef = useRef(null);
  const popupRef = useRef(null);

  const load = () => {
    axiosClient.get("/Notification/mine").then((res) => setNotifications(res.data)).catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const isButton = buttonRef.current && buttonRef.current.contains(e.target);
      const isPopup = popupRef.current && popupRef.current.contains(e.target);
      if (!isButton && !isPopup) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKey);
      document.body.classList.add("notif-lock-scroll");
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
      document.body.classList.remove("notif-lock-scroll");
    };
  }, [open]);

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

  const popupContent = open && (
    <>
      <div className="notif-backdrop" onClick={() => setOpen(false)} />
      <div ref={popupRef} className="notif-panel" role="dialog" aria-label="Notifications">
        <div className="notif-panel-grip" />

        <div className="notif-panel-header">
          <strong>Notifications</strong>
          <div className="notif-panel-actions">
            {unread.length > 0 && (
              <button onClick={handleMarkAllAsRead} title="Mark all as read" className="notif-icon-btn">
                <Check size={16} />
              </button>
            )}
            <button onClick={() => setOpen(false)} className="notif-icon-btn" aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="notif-tabs">
          <button
            onClick={() => setTab("unread")}
            className={`notif-tab ${tab === "unread" ? "active" : ""}`}
          >
            Unread {unread.length > 0 && `(${unread.length})`}
          </button>
          <button
            onClick={() => setTab("read")}
            className={`notif-tab ${tab === "read" ? "active" : ""}`}
          >
            Read
          </button>
        </div>

        <div className="notif-list">
          {visible.length === 0 ? (
            <p className="notif-empty">
              {tab === "unread" ? "No unread notifications." : "No read notifications."}
            </p>
          ) : (
            visible.map((n) => {
              const Icon = TYPE_ICONS[n.type] || <Bell size={16} />;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  className={`notif-row ${n.isRead ? "is-read" : "is-unread"}`}
                >
                  <div className="notif-row-icon">{Icon}</div>
                  <div className="notif-row-body">
                    <div className="notif-row-top">
                      <span className="notif-row-type">{TYPE_LABELS[n.type] || n.type}</span>
                      <span className="notif-row-time">{fmt(n.createdAt)}</span>
                    </div>
                    <p className="notif-row-msg">{n.message}</p>
                    {n.type === "waiting_list" && (
                      <button
                        onClick={(e) => handleGoToWaitingList(e, n.id)}
                        className="notif-cta"
                      >
                        Update time
                      </button>
                    )}
                  </div>
                  {!n.isRead && <span className="notif-dot" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="notif-trigger-wrap">
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        aria-label="Notifications"
        className="notif-trigger"
      >
        <Bell size={20} />
        {unread.length > 0 && (
          <span className="notif-badge">{unread.length > 9 ? "9+" : unread.length}</span>
        )}
      </button>

      {createPortal(popupContent, document.body)}
    </div>
  );
}
