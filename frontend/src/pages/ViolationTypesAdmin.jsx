import { useEffect, useState } from "react";
import { Container, Card, CardBody, Table, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, Alert } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import "../upark.css";

export default function ViolationTypesAdmin() {
  const [types, setTypes] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ code: "", description: "", points: "" });

  const [editType, setEditType] = useState(null);
  const [editForm, setEditForm] = useState({ description: "", points: "" });

  const load = () => {
    axiosClient.get("/ViolationType").then((res) => setTypes(res.data)).catch(() => setTypes([]));
  };

  useEffect(() => { load(); }, []);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const openCreate = () => {
    clearMessages();
    setCreateForm({ code: "", description: "", points: "" });
    setCreateOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axiosClient.post("/ViolationType", {
        Code: createForm.code,
        Description: createForm.description,
        Points: Number(createForm.points),
      });
      setSuccess("Violation type created.");
      setCreateOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Error while creating.");
    }
  };

  const openEdit = (type) => {
    clearMessages();
    setEditType(type);
    setEditForm({ description: type.description || "", points: type.points });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axiosClient.put(`/ViolationType/${editType.id}`, {
        Description: editForm.description,
        Points: Number(editForm.points),
      });
      setSuccess("Violation type updated.");
      setEditType(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Error while updating.");
    }
  };

  const handleDelete = async (type) => {
    clearMessages();
    if (!window.confirm(`Delete violation type "${type.code}" ?`)) return;
    try {
      await axiosClient.delete(`/ViolationType/${type.id}`);
      setSuccess("Violation type deleted.");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Error while deleting.");
    }
  };

  return (
    <AppLayout>
      <Container style={{ maxWidth: "800px", paddingTop: "24px", paddingBottom: "40px" }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#02457A", margin: 0 }}>
            Violation Types
          </h3>
          <Button color="primary" size="sm" onClick={openCreate} style={{ background: "#02457A", border: "none" }}>
            Add Type
          </Button>
        </div>
        <p style={{ color: "#6B7280", marginBottom: "20px" }}>
          Create or edit violation types and their points (used by workers and automatic scans).
        </p>

        {error && <Alert color="danger">{error}</Alert>}
        {success && <Alert color="success">{success}</Alert>}

        <Card className="upk-card">
          <CardBody style={{ padding: 0 }}>
            {types === null ? (
              <p style={{ color: "#6B7280", padding: "20px" }}>Loading...</p>
            ) : (
              <Table responsive className="mb-0" style={{ fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "#F7F5FE" }}>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Points</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: "monospace" }}>{t.code}</td>
                      <td>{t.description || "—"}</td>
                      <td>+{t.points}</td>
                      <td>
                        <Button size="sm" color="secondary" outline className="me-1" onClick={() => openEdit(t)}>
                          Edit
                        </Button>
                        <Button size="sm" color="danger" outline onClick={() => handleDelete(t)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {types.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ color: "#6B7280", textAlign: "center", padding: "20px" }}>
                        No violation types.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Create modal */}
        <Modal isOpen={createOpen} toggle={() => setCreateOpen(false)}>
          <ModalHeader toggle={() => setCreateOpen(false)}>Add a violation type</ModalHeader>
          <Form onSubmit={handleCreate}>
            <ModalBody>
              <FormGroup>
                <Label>Code</Label>
                <Input
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                  placeholder="e.g. bad_parking"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Description</Label>
                <Input
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Points</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={createForm.points}
                  onChange={(e) => setCreateForm({ ...createForm, points: e.target.value })}
                  required
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" color="primary" style={{ background: "#02457A", border: "none" }}>Create</Button>
            </ModalFooter>
          </Form>
        </Modal>

        {/* Edit modal */}
        <Modal isOpen={!!editType} toggle={() => setEditType(null)}>
          <ModalHeader toggle={() => setEditType(null)}>
            Edit {editType && `— ${editType.code}`}
          </ModalHeader>
          <Form onSubmit={handleEdit}>
            <ModalBody>
              <FormGroup>
                <Label>Description</Label>
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Points</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={editForm.points}
                  onChange={(e) => setEditForm({ ...editForm, points: e.target.value })}
                  required
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={() => setEditType(null)}>Cancel</Button>
              <Button type="submit" color="primary" style={{ background: "#02457A", border: "none" }}>Save</Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>
    </AppLayout>
  );
}