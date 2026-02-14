import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../axiosConfig";
import SaveDialogbox from "../SaveDialogbox";
import "../Accounts/Form.css";

/**
 * VendorForm - Form for adding/editing vendors
 */
const VendorForm = () => {
  const navigate = useNavigate();
  const { vendorId } = useParams();
  const isEditMode = !!vendorId;

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    phone_number: "",
    contact_person_name: "",
    contact_person_designation: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Fetch vendor if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchVendor();
    }
  }, [vendorId]);

  const fetchVendor = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/agreements/vendors/${vendorId}/`
      );
      setFormData({
        name: response.data.name || "",
        address: response.data.address || "",
        email: response.data.email || "",
        phone_number: response.data.phone_number || "",
        contact_person_name: response.data.contact_person_name || "",
        contact_person_designation: response.data.contact_person_designation || "",
      });
    } catch (err) {
      console.error("Error fetching vendor:", err);
      setError("Failed to load vendor details");
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
          `/agreements/vendors/${vendorId}/`,
          formData
        );
      } else {
        await axiosInstance.post("/agreements/vendors/", formData);
      }

      setIsDone(true);
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.response?.data?.detail || "Failed to save vendor");
      setIsSaving(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/configurations/agreements/vendors");
  };

  return (
    <div className="form-container">
      <SaveDialogbox
        isOpen={isSaving}
        isComplete={isDone}
        title={isDone ? "Success" : isEditMode ? "Updating..." : "Saving..."}
        subtitle={
          isDone && isEditMode
            ? "Vendor information has been updated successfully."
            : "Vendor information has been saved successfully."
        }
        onClose={() => {
          setIsSaving(false);
          navigate("/configurations/agreements/vendors");
        }}
      />

      <div className="form-header">
        <h2>{isEditMode ? "Edit Vendor" : "Add Vendor"}</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="name">Vendor Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            maxLength="255"
            placeholder="Enter vendor name"
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
            placeholder="Enter vendor address"
            rows="4"
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
            placeholder="Enter vendor email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone_number">Phone Number *</label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleInputChange}
            required
            maxLength="15"
            placeholder="e.g., +1234567890"
            pattern="^\+?1?\d{9,15}$"
            title="Phone number must be between 9-15 digits, optionally starting with +"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contact_person_name">Contact Person Name</label>
          <input
            type="text"
            id="contact_person_name"
            name="contact_person_name"
            value={formData.contact_person_name}
            onChange={handleInputChange}
            maxLength="150"
            placeholder="Enter contact person's name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contact_person_designation">Contact Person Designation</label>
          <input
            type="text"
            id="contact_person_designation"
            name="contact_person_designation"
            value={formData.contact_person_designation}
            onChange={handleInputChange}
            maxLength="100"
            placeholder="e.g., Manager, Director"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? "Saving..." : isEditMode ? "Update Vendor" : "Save"}
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

export default VendorForm;
