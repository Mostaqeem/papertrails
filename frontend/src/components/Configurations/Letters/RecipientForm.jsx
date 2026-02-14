import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../axiosConfig";
import SaveDialogbox from "../SaveDialogbox";
import "../Accounts/Form.css";

/**
 * RecipientForm - Form for adding/editing recipients
 */
const RecipientForm = () => {
  const navigate = useNavigate();
  const { recipientId } = useParams();
  const isEditMode = !!recipientId;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    department: "",
    designation: "",
    short_designation: "",
    phone_number: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Fetch recipient if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchRecipient();
    }
  }, [recipientId]);

  const fetchOrganizations = async () => {
    setOrganizationsLoading(true);
    try {
      const response = await axiosInstance.get("/letters/organizations_crud/");
      console.log("Organizations response:", response.data);
      let organizationsList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      console.log("Parsed organizations list:", organizationsList);
      setOrganizations(organizationsList);
    } catch (err) {
      console.error("Error fetching organizations:", err);
      setError("Failed to load organizations");
    } finally {
      setOrganizationsLoading(false);
    }
  };

  const fetchRecipient = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/letters/recipients_crud/${recipientId}/`
      );
      console.log("Recipient data:", response.data);
      setFormData({
        name: response.data.name || "",
        email: response.data.email || "",
        organization: response.data.organization || "",
        department: response.data.department || "",
        designation: response.data.designation || "",
        short_designation: response.data.short_designation || "",
        phone_number: response.data.phone_number || "",
      });
    } catch (err) {
      console.error("Error fetching recipient:", err);
      setError("Failed to load recipient details");
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
          `/letters/recipients_crud/${recipientId}/`,
          formData
        );
      } else {
        await axiosInstance.post("/letters/recipients_crud/", formData);
      }

      setIsDone(true);
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.response?.data?.detail || "Failed to save recipient");
      setIsSaving(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/configurations/letters/recipients");
  };

  return (
    <div className="form-container">
      <SaveDialogbox
        isOpen={isSaving}
        isComplete={isDone}
        title={isDone ? "Success" : isEditMode ? "Updating..." : "Saving..."}
        subtitle={
          isDone && isEditMode
            ? "Recipient has been updated successfully."
            : "Recipient has been saved successfully."
        }
        onClose={() => {
          setIsSaving(false);
          navigate("/configurations/letters/recipients");
        }}
      />

      <div className="form-header">
        <h2>{isEditMode ? "Edit Recipient" : "Add Recipient"}</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="name">Recipient Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            maxLength="255"
            placeholder="Enter recipient name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            maxLength="255"
            placeholder="Enter email address"
          />
        </div>

        <div className="form-group">
          <label htmlFor="organization">Organization *</label>
          <select
            id="organization"
            name="organization"
            value={formData.organization}
            onChange={handleInputChange}
            required
            disabled={organizationsLoading}
          >
            <option value="">Select an organization</option>
            {organizations && organizations.length > 0 ? (
              organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))
            ) : (
              <option disabled>No organizations available</option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="department">Department</label>
          <input
            type="text"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            maxLength="100"
            placeholder="Enter department"
          />
        </div>

        <div className="form-group">
          <label htmlFor="designation">Designation *</label>
          <input
            type="text"
            id="designation"
            name="designation"
            value={formData.designation}
            onChange={handleInputChange}
            required
            maxLength="100"
            placeholder="Enter designation"
          />
        </div>

        <div className="form-group">
          <label htmlFor="short_designation">Short Designation</label>
          <input
            type="text"
            id="short_designation"
            name="short_designation"
            value={formData.short_designation}
            onChange={handleInputChange}
            maxLength="50"
            placeholder="Enter short designation"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone_number">Phone Number</label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleInputChange}
            maxLength="15"
            placeholder="Enter phone number"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading
              ? "Saving..."
              : isEditMode
              ? "Update Recipient"
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

export default RecipientForm;
