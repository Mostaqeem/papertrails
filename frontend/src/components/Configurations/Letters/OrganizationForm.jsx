import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../axiosConfig";
import SaveDialogbox from "../SaveDialogbox";
import "../Accounts/Form.css";

/**
 * OrganizationForm - Form for adding/editing organizations
 */
const OrganizationForm = () => {
  const navigate = useNavigate();
  const { organizationId } = useParams();
  const isEditMode = !!organizationId;

  const [formData, setFormData] = useState({
    name: "",
    short_form: "",
    address: "",
    organization_type: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Fetch organization if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchOrganization();
    }
  }, [organizationId]);

  const fetchOrganization = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/letters/organizations_crud/${organizationId}/`
      );
      setFormData({
        name: response.data.name || "",
        short_form: response.data.short_form || "",
        address: response.data.address || "",
        organization_type: response.data.organization_type || "",
      });
    } catch (err) {
      console.error("Error fetching organization:", err);
      setError("Failed to load organization details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
          `/letters/organizations_crud/${organizationId}/`,
          formData
        );
      } else {
        await axiosInstance.post("/letters/organizations_crud/", formData);
      }

      setIsDone(true);
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.response?.data?.detail || "Failed to save organization");
      setIsSaving(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/configurations/letters/organizations");
  };

  return (
    <div className="form-container">
      <SaveDialogbox
        isOpen={isSaving}
        isComplete={isDone}
        title={isDone ? "Success" : isEditMode ? "Updating..." : "Saving..."}
        subtitle={
          isDone && isEditMode
            ? "Organization has been updated successfully."
            : "Organization has been saved successfully."
        }
        onClose={() => {
          setIsSaving(false);
          navigate("/configurations/letters/organizations");
        }}
      />

      <div className="form-header">
        <h2>{isEditMode ? "Edit Organization" : "Add Organization"}</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="name">Organization Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            maxLength="255"
            placeholder="Enter organization name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="short_form">Short Form *</label>
          <input
            type="text"
            id="short_form"
            name="short_form"
            value={formData.short_form}
            onChange={handleInputChange}
            required
            maxLength="50"
            placeholder="Enter short form (e.g., ABC)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address *</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            placeholder="Enter organization address"
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="organization_type">Organization Type *</label>
          <input
            type="text"
            id="organization_type"
            name="organization_type"
            value={formData.organization_type}
            onChange={handleInputChange}
            required
            maxLength="255"
            placeholder="Enter organization type"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading
              ? "Saving..."
              : isEditMode
              ? "Update Organization"
                : "Save"}
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

export default OrganizationForm;
