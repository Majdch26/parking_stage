import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import PasswordRecovery from "./pages/PasswordRecovery";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import MyVehicles from "./pages/MyVehicles";
import Reservation from "./pages/Reservation";
import WorkerViolation from "./pages/WorkerViolation";
import ParkingStatus from "./pages/ParkingStatus";
import Session from "./pages/Session";
import AppLayout from "./components/AppLayout";
import SlotQrCodes from "./pages/SlotQrCodes"; // adjust path to match your actual folder
import ScanMySlot from "./pages/ScanMySlot"; // adjust path to match your structure
import GateSimulator from "./pages/GateSimulator"; // adjust path to match your structure
import History from "./pages/History"; // adjust path
import WorkerCheckIn from "./pages/WorkerCheckIn";
import ZoneQrCodes from "./pages/ZoneQrCodes";
import AssistanceRequest from "./pages/AssistanceRequest";
import WorkerAssistance from "./pages/WorkerAssistance";
import Rules from "./pages/Rules";
import WaitingList from "./pages/WaitingList";
import AdminUsers from "./pages/AdminUsers";

// Worker scheduling / shift-management pages
import WorkerZones from "./pages/WorkerZones";
import WorkerSchedule from "./pages/WorkerSchedule";
import WorkerSession from "./pages/WorkerSession";
import WorkerHistory from "./pages/WorkerHistory";
import WorkerChat from "./pages/WorkerChat";

// Admin pages
import AdminActivityLog from "./pages/AdminActivityLog";
import ViolationTypesAdmin from "./pages/ViolationTypesAdmin";



export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<PasswordRecovery />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Navigate to="/login" />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
               <AppLayout>
                  <Dashboard />
               </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <MyVehicles />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reservation"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Reservation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/worker/violation"
          element={
            <ProtectedRoute allowedRoles={["worker", "admin"]}>
              <WorkerViolation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/parking-status"
          element={
            <ProtectedRoute>
              <ParkingStatus />
            </ProtectedRoute>
          }
        />

        <Route
          path="/session"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Session />
            </ProtectedRoute>
          }
        />

        <Route path="/admin/slot-qr-codes" element={<SlotQrCodes />} />
        <Route path="/scan-slot" element={<ScanMySlot />} />
        <Route path="/gate-simulator" element={<ProtectedRoute><GateSimulator /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/worker/check-in" element={<ProtectedRoute><WorkerCheckIn /></ProtectedRoute>} />
        <Route path="/admin/zone-qr-codes" element={<ProtectedRoute><ZoneQrCodes /></ProtectedRoute>} />
        <Route path="/assistance" element={<ProtectedRoute><AssistanceRequest /></ProtectedRoute>} />
        <Route path="/worker/assistance" element={<ProtectedRoute><WorkerAssistance /></ProtectedRoute>} />
        <Route path="/rules" element={<ProtectedRoute><Rules /></ProtectedRoute>} />
        <Route path="/waiting-list" element={<ProtectedRoute><WaitingList /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />

        {/* Worker scheduling / shift-management */}
        <Route path="/worker/zones" element={<ProtectedRoute><WorkerZones /></ProtectedRoute>} />
        <Route path="/worker/schedule" element={<ProtectedRoute><WorkerSchedule /></ProtectedRoute>} />
        <Route path="/worker/session" element={<ProtectedRoute><WorkerSession /></ProtectedRoute>} />
        <Route path="/worker/history" element={<ProtectedRoute><WorkerHistory /></ProtectedRoute>} />
        <Route path="/worker/chat" element={<ProtectedRoute><WorkerChat /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/activity-log" element={<ProtectedRoute><AdminActivityLog /></ProtectedRoute>} />
        <Route path="/admin/violation-types" element={<ProtectedRoute><ViolationTypesAdmin /></ProtectedRoute>} />
      </Routes>
    </HashRouter>
  );
}