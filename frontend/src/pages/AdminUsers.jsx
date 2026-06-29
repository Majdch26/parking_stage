import { useState, useEffect } from "react";
import { Container, Card, CardBody, Table, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, Alert } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

const ROLE_LABELS = { student: "Student", worker: "Worker", admin: "Admin" };
const TABS = [
  { key: "admin", label: "Admin" },
  { key: "worker", label: "Workers" },
  { key: "student", label: "Students" },
];

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("admin");

  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "" });

  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const [historyUser, setHistoryUser] = useState(null);
  const [historyData, setHistoryData] = useState(null);

  const [infoUser, setInfoUser] = useState(null);
  const [infoVehicles, setInfoVehicles] = useState(null);

  const [createWorkerOpen, setCreateWorkerOpen] = useState(false);
  const [createWorkerForm, setCreateWorkerForm] = useState({
    firstName: "", lastName: "", email: "", password: "", storedId: "",
  });

  const load = () => {
    axiosClient.get("/User").then((res) => setUsers(res.data)).catch(() => setUsers([]));
  };

  useEffect(() => { load(); }, []);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleBanToggle = async (user) => {
    clearMessages();
    try {
      if (user.status === "blocked") {
        await axiosClient.post(`/User/${user.id}/unban`);
        setSuccess(`${user.firstName} ${user.lastName} has been unblocked.`);
      } else {
        await axiosClient.post(`/User/${user.id}/ban`);
        setSuccess(`${user.firstName} ${user.lastName} has been blocked.`);
      }
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed.");
    }
  };

  const openEdit = (user) => {
    clearMessages();
    setEditUser(user);
    setEditForm({ firstName: user.firstName, lastName: user.lastName, email: user.email });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axiosClient.put(`/User/${editUser.id}`, {
        FirstName: editForm.firstName,
        LastName: editForm.lastName,
        Email: editForm.email,
      });
      setSuccess("User updated.");
      setEditUser(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Update failed.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axiosClient.post(`/User/${resetUser.id}/reset-password`, { NewPassword: newPassword });
      setSuccess(`Password reset for ${resetUser.firstName} ${resetUser.lastName}.`);
      setResetUser(null);
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed.");
    }
  };

  const openHistory = (user) => {
    clearMessages();
    setHistoryUser(user);
    setHistoryData(null);
    axiosClient.get(`/Session/history/${user.id}`).then((res) => setHistoryData(res.data)).catch(() => setHistoryData([]));
  };

  const openInfo = (user) => {
    clearMessages();
    setInfoUser(user);
    setInfoVehicles(null);
    if (user.role === "student") {
      axiosClient.get(`/Vehicle/user/${user.id}`).then((res) => setInfoVehicles(res.data)).catch(() => setInfoVehicles([]));
    }
  };

  const openCreateWorker = () => {
    clearMessages();
    setCreateWorkerForm({ firstName: "", lastName: "", email: "", password: "", storedId: "" });
    setCreateWorkerOpen(true);
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axiosClient.post("/User/create-worker", {
        FirstName: createWorkerForm.firstName,
        LastName: createWorkerForm.lastName,
        Email: createWorkerForm.email,
        Password: createWorkerForm.password,
        StoredId: createWorkerForm.storedId,
      });
      setSuccess("Worker created.");
      setCreateWorkerOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Creation failed.");
    }
  };

  const fmt = (d) =>
    d ? new Date(d).toLocaleString("en-US", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

  const visibleUsers = (users || []).filter((u) => u.role === activeTab);

  return (
    <AppLayout>
      <Container style={{ maxWidth: "1000px", paddingTop: "24px", paddingBottom: "40px" }}>
        <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#02457A" }}>User Management</h3>
        <p style={{ color: "#6B7280", marginBottom: "20px" }}>
          Edit, ban/unban, reset password, or view details of any account.
        </p>

        {error && <Alert color="danger">{error}</Alert>}
        {success && <Alert color="success">{success}</Alert>}

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex gap-2">
            {TABS.map((t) => (
              <Button
                key={t.key}
                size="sm"
                color={activeTab === t.key ? "primary" : "secondary"}
                outline={activeTab !== t.key}
                onClick={() => setActiveTab(t.key)}
                style={activeTab === t.key ? { background: "#02457A", border: "none" } : {}}
              >
                {t.label}
              </Button>
            ))}
          </div>
          {activeTab === "worker" && (
            <Button size="sm" color="primary" onClick={openCreateWorker} style={{ background: "#02457A", border: "none" }}>Add Worker</Button>
          )}
        </div>

        <Card className="upk-card">
          <CardBody style={{ padding: 0 }}>
            {users === null ? (
              <p style={{ color: "#6B7280", padding: "20px" }}>Loading...</p>
            ) : (
              <Table responsive className="mb-0" style={{ fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "#F7F5FE" }}>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Points</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={{ color: "#6B7280", fontFamily: "monospace" }}>{u.storedId || (u.role === "admin" ? "—" : `#${u.id}`)}</td>
                      <td>{u.firstName} {u.lastName}</td>
                      <td>{u.email}</td>
                      <td style={{ textTransform: "capitalize" }}>{ROLE_LABELS[u.role] || u.role}</td>
                      <td>{u.points}</td>
                      <td>
                        <Badge color={u.status === "blocked" ? "danger" : "success"}>
                          {u.status === "blocked" ? "Blocked" : "Active"}
                        </Badge>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <Button size="sm" color="secondary" outline className="me-1" onClick={() => openEdit(u)}>Edit</Button>
                        {u.role === "admin" && (
                          <Button size="sm" color="secondary" outline className="me-1" onClick={() => setResetUser(u)}>Password</Button>
                        )}
                        {u.role === "student" && (
                          <>
                            <Button size="sm" color="secondary" outline className="me-1" onClick={() => openInfo(u)}>Info</Button>
                            <Button size="sm" color="secondary" outline className="me-1" onClick={() => openHistory(u)}>History</Button>
                          </>
                        )}
                        {u.role !== "admin" && (
                          <Button
                            size="sm"
                            color={u.status === "blocked" ? "success" : "danger"}
                            onClick={() => handleBanToggle(u)}
                          >
                            {u.status === "blocked" ? "Unblock" : "Block"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {visibleUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ color: "#6B7280", textAlign: "center", padding: "20px" }}>
                        No accounts in this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Edit modal */}
        <Modal isOpen={!!editUser} toggle={() => setEditUser(null)}>
          <ModalHeader toggle={() => setEditUser(null)}>Edit User</ModalHeader>
          <Form onSubmit={handleSaveEdit}>
            <ModalBody>
              <FormGroup>
                <Label>First Name</Label>
                <Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} required />
              </FormGroup>
              <FormGroup>
                <Label>Last Name</Label>
                <Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} required />
              </FormGroup>
              <FormGroup>
                <Label>Email</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button type="submit" color="primary" style={{ background: "#02457A", border: "none" }}>Save</Button>
            </ModalFooter>
          </Form>
        </Modal>

        {/* Reset password modal */}
        <Modal isOpen={!!resetUser} toggle={() => setResetUser(null)}>
          <ModalHeader toggle={() => setResetUser(null)}>
            Reset password {resetUser && `— ${resetUser.firstName} ${resetUser.lastName}`}
          </ModalHeader>
          <Form onSubmit={handleResetPassword}>
            <ModalBody>
              <FormGroup>
                <Label>New password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={() => setResetUser(null)}>Cancel</Button>
              <Button type="submit" color="primary" style={{ background: "#02457A", border: "none" }}>Reset</Button>
            </ModalFooter>
          </Form>
        </Modal>

        {/* History modal */}
        <Modal isOpen={!!historyUser} toggle={() => setHistoryUser(null)} size="lg">
          <ModalHeader toggle={() => setHistoryUser(null)}>
            History — {historyUser && `${historyUser.firstName} ${historyUser.lastName}`}
          </ModalHeader>
          <ModalBody style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {historyData === null ? (
              <p style={{ color: "#6B7280" }}>Loading...</p>
            ) : historyData.length === 0 ? (
              <p style={{ color: "#6B7280" }}>No sessions recorded.</p>
            ) : (
              historyData.map((s) => (
                <Card key={s.sessionId} className="mb-3 upk-card">
                  <CardBody style={{ padding: "16px" }}>
                    <Badge color={s.status === "left" ? "secondary" : "success"} className="mb-2">{s.status}</Badge>
                    <p className="mb-1"><strong>Entry:</strong> {fmt(s.entryTime)}</p>
                    <p className="mb-1"><strong>Slot:</strong> {s.slotNumber ? `${s.areaName} — ${s.slotNumber}` : "—"}</p>
                    <p className="mb-1"><strong>Exit:</strong> {fmt(s.exitTime)}</p>
                    {s.violations?.length > 0 && (
                      <div className="mt-2">
                        <strong style={{ fontSize: "0.85rem" }}>Violations:</strong>
                        {s.violations.map((v) => (
                          <div key={v.id} style={{ fontSize: "0.85rem", color: "#C62828" }}>
                            {v.violationTypeCode.replace(/_/g, " ")} (+{v.points} pts)
                          </div>
                        ))}
                      </div>
                    )}
                    {s.assistanceRequests?.length > 0 && (
                      <div className="mt-2">
                        <strong style={{ fontSize: "0.85rem" }}>Assistance:</strong>
                        {s.assistanceRequests.map((r) => (
                          <div key={r.id} style={{ fontSize: "0.85rem" }}>
                            {r.requestType.replace(/_/g, " ")} — {r.status}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))
            )}
          </ModalBody>
        </Modal>

        {/* Info modal */}
        <Modal isOpen={!!infoUser} toggle={() => setInfoUser(null)}>
          <ModalHeader toggle={() => setInfoUser(null)}>
            Info — {infoUser && `${infoUser.firstName} ${infoUser.lastName}`}
          </ModalHeader>
          <ModalBody>
            {infoUser && (
              <>
                <p className="mb-1"><strong>University ID:</strong> {infoUser.storedId || "—"}</p>
                <p className="mb-1"><strong>First Name:</strong> {infoUser.firstName}</p>
                <p className="mb-1"><strong>Last Name:</strong> {infoUser.lastName}</p>
                <p className="mb-3"><strong>Email:</strong> {infoUser.email}</p>
                {infoUser.role === "student" && (
                  <p className="mb-3">
                    <strong>Total violation points:</strong>{" "}
                    <Badge color={infoUser.points >= 100 ? "danger" : infoUser.points > 0 ? "warning" : "success"}>
                      {infoUser.points} pts
                    </Badge>
                  </p>
                )}
              </>
            )}

            {infoUser?.role === "student" && (
              <>
                <strong style={{ fontSize: "0.9rem" }}>Vehicles</strong>
                {infoVehicles === null ? (
                  <p style={{ color: "#6B7280", fontSize: "0.85rem" }}>Loading...</p>
                ) : infoVehicles.length === 0 ? (
                  <p style={{ color: "#6B7280", fontSize: "0.85rem" }}>No vehicles registered.</p>
                ) : (
                  infoVehicles.map((v) => (
                    <div key={v.id} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: "1px solid #EEF1F5" }}>
                      <div>
                        <strong>{v.brandName} {v.modelName}</strong>
                        <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>
                          {v.plateNumber} · {v.vehicleTypeName}{v.color ? ` · ${v.color}` : ""}{v.year ? ` · ${v.year}` : ""}
                        </div>
                      </div>
                      {v.isPrimary && <Badge color="primary">Primary</Badge>}
                    </div>
                  ))
                )}
              </>
            )}
          </ModalBody>
        </Modal>

        {/* Create worker modal */}
        <Modal isOpen={createWorkerOpen} toggle={() => setCreateWorkerOpen(false)}>
          <ModalHeader toggle={() => setCreateWorkerOpen(false)}>Add a Worker</ModalHeader>
          <Form onSubmit={handleCreateWorker}>
            <ModalBody>
              <FormGroup>
                <Label>University ID</Label>
                <Input
                  value={createWorkerForm.storedId}
                  onChange={(e) => setCreateWorkerForm({ ...createWorkerForm, storedId: e.target.value })}
                  placeholder="e.g. W1001"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>First Name</Label>
                <Input
                  value={createWorkerForm.firstName}
                  onChange={(e) => setCreateWorkerForm({ ...createWorkerForm, firstName: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Last Name</Label>
                <Input
                  value={createWorkerForm.lastName}
                  onChange={(e) => setCreateWorkerForm({ ...createWorkerForm, lastName: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={createWorkerForm.email}
                  onChange={(e) => setCreateWorkerForm({ ...createWorkerForm, email: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={createWorkerForm.password}
                  onChange={(e) => setCreateWorkerForm({ ...createWorkerForm, password: e.target.value })}
                  minLength={6}
                  required
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={() => setCreateWorkerOpen(false)}>Cancel</Button>
              <Button type="submit" color="primary" style={{ background: "#02457A", border: "none" }}>Create</Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>
    </AppLayout>
  );
}