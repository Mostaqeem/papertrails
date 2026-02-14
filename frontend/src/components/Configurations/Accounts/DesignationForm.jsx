import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../axiosConfig";
import "./Form.css";
import SaveDialogbox from "../SaveDialogbox";

/**
 * DesignationForm - Form for adding/editing designations
 */
const DesignationForm = () => {
  const navigate = useNavigate();
  const { designationId } = useParams();
  const isEditMode = !!designationId;

  const [formData, setFormData] = useState({
    designation: "",
    short_designation: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false); 
  const [success, setSuccess] = useState(false);

  // Fetch designation if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchDesignation();
    }
  }, [designationId]);

  const fetchDesignation = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/accounts/designation-update-delete/${designationId}/`
      );
      setFormData({
        designation: response.data.designation || "",
        short_designation: response.data.short_designation || "",
      });
    } catch (err) {
      console.error("Error fetching designation:", err);
      setError("Failed to load designation details");
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
          `/accounts/designation-update-delete/${designationId}/`,
          formData
        );
        setSuccess("Designation updated successfully!");
      } else {
        await axiosInstance.post(
          "/accounts/designations-createlist/",
          formData
        );
      }

      setIsDone(true);

      // Redirect back to designations list after 1 second
      // setTimeout(() => {
      //   navigate("/configurations/accounts/designations");
      //   setIsSaving(false);
      // }, 1000);
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.response?.data?.detail || "Failed to save designation");
      setIsSaving(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/configurations/accounts/designations");
  };

  return (
    <div className="form-container">
      <SaveDialogbox
        isOpen={isSaving}
        isComplete={isDone}
        // Change text dynamically once saving is finished
        title={isDone ? "Success" : isEditMode ? "Updating..." : "Saving..."}
        subtitle={
          isDone & isEditMode
            ? "Designation has been updated successfully."
            : "Designation has been saved successfully."
        }
        // This is the function that runs when "Continue" is clicked
        onClose={() => {
          setIsSaving(false);
          navigate("/configurations/accounts/designations");
        }}
      />
      <div className="form-header">
        <h2>{isEditMode ? "Edit Designation" : "Save"}</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="form">
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
            placeholder="e.g., Senior Manager, Developer"
          />
        </div>

        <div className="form-group">
          <label htmlFor="short_designation">Short Form</label>
          <input
            type="text"
            id="short_designation"
            name="short_designation"
            value={formData.short_designation}
            onChange={handleInputChange}
            maxLength="50"
            placeholder="e.g., SM, DEV"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Saving..." : isEditMode ? "Update Designation" : "Save"}
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

export default DesignationForm;
