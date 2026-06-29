import { useState, useEffect } from "react";
import { Form, FormGroup, Label, Input, Alert } from "reactstrap";
import axiosClient from "../api/axiosClient";
import AutocompleteSelect from "./AutocompleteSelect";
import "../upark.css";

export default function VehicleForm({ onSuccess, onCancel }) {
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [form, setForm] = useState({
    brandId: "",
    modelId: "",
    plateNumber: "",
    year: "",
    color: "",
    isPrimary: false,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    axiosClient.get("/Vehicle/brands").then((res) => setBrands(res.data));
  }, []);

  useEffect(() => {
    if (form.brandId) {
      axiosClient
        .get(`/Vehicle/brands/${form.brandId}/models`)
        .then((res) => setModels(res.data));
    } else {
      setModels([]);
    }
    setForm((prev) => ({ ...prev, modelId: "" }));
  }, [form.brandId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.brandId || !form.modelId) {
      setError("Choisis une marque et un modèle dans les suggestions.");
      return;
    }

    try {
      await axiosClient.post("/Vehicle", {
        ModelId: Number(form.modelId),
        PlateNumber: form.plateNumber,
        Year: form.year ? Number(form.year) : null,
        Color: form.color || null,
        IsPrimary: form.isPrimary,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout du véhicule.");
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert color="danger">{error}</Alert>}
      <FormGroup>
        <span className="upk-label">Marque</span>
        <AutocompleteSelect
          options={brands.map((b) => ({ id: b.id, label: b.name }))}
          value={form.brandId}
          onChange={(brandId) => setForm({ ...form, brandId })}
          placeholder="Tape pour chercher une marque..."
          emptyMessage="Aucune marque trouvée."
        />
      </FormGroup>

      <FormGroup>
        <span className="upk-label">Modèle</span>
        <AutocompleteSelect
          options={models.map((m) => ({ id: m.id, label: `${m.name} (${m.vehicleTypeName})` }))}
          value={form.modelId}
          onChange={(modelId) => setForm({ ...form, modelId })}
          placeholder={form.brandId ? "Tape pour chercher un modèle..." : "Choisis une marque d'abord"}
          disabled={!form.brandId}
          emptyMessage="Aucun modèle trouvé."
        />
      </FormGroup>

      <FormGroup>
        <span className="upk-label">Numéro de plaque</span>
        <Input
          id="plateNumber"
          name="plateNumber"
          value={form.plateNumber}
          onChange={handleChange}
          required
          style={{ borderRadius: "12px", border: "1px solid #e3e7f0", fontFamily: "'JetBrains Mono', monospace" }}
        />
      </FormGroup>

      <FormGroup>
        <span className="upk-label">Année (optionnel)</span>
        <Input
          type="select"
          id="year"
          name="year"
          value={form.year}
          onChange={handleChange}
          style={{ borderRadius: "12px", border: "1px solid #e3e7f0" }}
        >
          <option value="">-- Choisir une année --</option>
          {Array.from({ length: 35 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Input>
      </FormGroup>

      <FormGroup>
        <span className="upk-label">Couleur (optionnel)</span>
        <Input
          id="color"
          name="color"
          value={form.color}
          onChange={handleChange}
          style={{ borderRadius: "12px", border: "1px solid #e3e7f0" }}
        />
      </FormGroup>

      <FormGroup check className="mb-3">
        <Label check style={{ fontSize: "0.88rem", color: "#4a5568" }}>
          <Input type="checkbox" name="isPrimary" checked={form.isPrimary} onChange={handleChange} />{" "}
          Définir comme véhicule principal
        </Label>
      </FormGroup>

      <div className="d-flex gap-2">
        <button type="submit" className="upk-btn upk-btn-primary">Ajouter</button>
        <button type="button" className="upk-btn upk-btn-ghost" onClick={onCancel}>Annuler</button>
      </div>
    </Form>
  );
}