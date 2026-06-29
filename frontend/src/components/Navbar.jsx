import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Map,
  Car,
  CalendarCheck,
  LogIn,
  LifeBuoy,
  ShieldAlert,
  History,
  MessageCircle,
  LogOut,
  Users,
  QrCode,
  Activity,
  User,
  Clock,
  CheckSquare,
  Scan,
  MapPin,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import "./Navbar.css";

export default function Navbar() {
  const role = localStorage.getItem("role");
  const firstName = localStorage.getItem("firstName") || "U";
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("firstName");
    navigate("/login");
  };

  // Liens pour les étudiants
  const studentLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { to: "/parking-status", label: "Parking map", icon: Map },
    { to: "/vehicles", label: "Vehicles", icon: Car },
    { to: "/reservation", label: "Reservation", icon: CalendarCheck },
    { to: "/session", label: "My session", icon: LogIn },
    { to: "/assistance", label: "Assistance", icon: LifeBuoy },
    { to: "/scan-slot", label: "Scan my slot", icon: Scan },
    { to: "/history", label: "History", icon: History },
    { to: "/profile", label: "Profile", icon: User },
  ];

  // Liens pour les employés (workers)
  const workerLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { to: "/parking-status", label: "Parking map", icon: Map },
    { to: "/worker/check-in", label: "Check-in/out", icon: CheckSquare },
    { to: "/gate-simulator", label: "Gate scanner", icon: Scan },
    { to: "/worker/assistance", label: "Assistance", icon: LifeBuoy },
    { to: "/worker/violation", label: "Add violation", icon: ShieldAlert },
    { to: "/worker/schedule", label: "My schedule", icon: Clock },
    { to: "/worker/session", label: "My session", icon: LogIn },
    { to: "/worker/zones", label: "Zones", icon: MapPin },
    { to: "/worker/history", label: "History", icon: History },
    { to: "/worker/chat", label: "Team chat", icon: MessageCircle },
    { to: "/profile", label: "Profile", icon: User },
  ];

  // Liens pour les administrateurs
  const adminLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { to: "/parking-status", label: "Parking map", icon: Map },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/activity-log", label: "Activity log", icon: Activity },
    { to: "/admin/violation-types", label: "Violation types", icon: ShieldAlert },
    { to: "/admin/slot-qr-codes", label: "Slot QR codes", icon: QrCode },
    { to: "/admin/zone-qr-codes", label: "Zone QR codes", icon: QrCode },
    { to: "/profile", label: "Profile", icon: User },
  ];

  let links = [];
  if (role === "student") links = studentLinks;
  else if (role === "worker") links = workerLinks;
  else if (role === "admin") links = adminLinks;
  else links = studentLinks;

  const initials = firstName.slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      {/* Logo - visible uniquement sur desktop, sur mobile il est masqué par CSS */}
      <Link to="/dashboard" className="logo" title="UPark">
        <svg viewBox="0 0 48 48">
          <path
            d="M15 12v15a9 9 0 0 0 18 0V12"
            fill="none"
            stroke="#fff"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="24" cy="20" r="3.4" fill="#fff" />
        </svg>
        <span className="logo-text">UPark</span>
      </Link>

      <nav className="nav">
        {links.map((l) => {
          const Icon = l.icon;
          const active = location.pathname === l.to;
          return (
            <Link key={l.to} to={l.to} title={l.label} className={active ? "active" : ""}>
              <Icon size={20} />
              <span className="nav-label">{l.label}</span>
            </Link>
          );
        })}
        <div className="nav-bell">
          <NotificationBell />
        </div>
      </nav>

      <div className="bottom">
        <div className="avatar" title={firstName}>
          {initials}
        </div>
        <button className="logout" onClick={handleLogout} title="Log out" aria-label="Log out">
          <LogOut size={19} />
          <span className="logout-label">Sign out</span>
        </button>
      </div>
    </aside>
  );
}