import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../axiosConfig";
import SaveDialogbox from "../SaveDialogbox";
import "../Accounts/Form.css";

/**
 * AgreementTypeForm - Form for adding/editing agreement types
 */
const AgreementTypeForm = () => {
  const navigate = useNavigate();
  const { typeId } = useParams();
  const isEditMode = !!typeId;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Fetch agreement type if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchAgreementType();
    }
  }, [typeId]);

  const fetchAgreementType = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/agreements/agreement-types/${typeId}/`
      );
      setFormData({
        name: response.data.name || "",
        description: response.data.description || "",
        is_active: response.data.is_active || true,
      });
    } catch (err) {
      console.error("Error fetching agreement type:", err);
      setError("Failed to load agreement type details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsSaving(true);
    setIsDone(false);

    try {
      if (isEditMode) {
        await axiosInstance.put(
          `/agreements/agreement-types/${typeId}/`,
          formData
        );
      } else {
        await axiosInstance.post("/agreements/agreement-types/", formData);
      }

      setIsDone(true);
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.response?.data?.detail || "Failed to save agreement type");
      setIsSaving(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/configurations/agreements/types");
  };

  return (
    <div className="form-container">
      <SaveDialogbox
        isOpen={isSaving}
        isComplete={isDone}
        title={isDone ? "Success" : isEditMode ? "Updating..." : "Saving..."}
        subtitle={
          isDone && isEditMode
            ? "Agreement Type has been updated successfully."
            : "Agreement Type has been saved successfully."
        }
        onClose={() => {
          setIsSaving(false);
          navigate("/configurations/agreements/types");
        }}
      />

      <div className="form-header">
        <h2>{isEditMode ? "Edit Agreement Type" : "Add Agreement Type"}</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="name">Type Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            maxLength="100"
            placeholder="e.g., Service Agreement, License Agreement"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter agreement type description"
            rows="4"
          />
        </div>

        <div className="form-group checkbox-group">
          <label htmlFor="is_active">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
            />
            <span>Active</span>
          </label>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? "Saving..." : isEditMode ? "Update Agreement Type" : "Save"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgreementTypeForm;
