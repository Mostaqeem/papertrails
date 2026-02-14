import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../axiosConfig";
import SaveDialogbox from "../SaveDialogbox"; //
import "./Form.css";

/**
 * DepartmentForm - Form for adding/editing departments
 */
const DepartmentForm = () => {
  const navigate = useNavigate();
  const { departmentId } = useParams();
  const isEditMode = !!departmentId;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    executive: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // States for the Dialog Box
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchDepartment();
    }
  }, [departmentId]);

  const fetchDepartment = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/accounts/department-update-delete/${departmentId}/`
      );
      setFormData({
        name: response.data.name || "",
        description: response.data.description || "",
        executive: response.data.executive || false,
      });
    } catch (err) {
      console.error("Error fetching department:", err);
      setError("Failed to load department details");
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

    // Open the dialog
    setIsSaving(true);
    setIsDone(false);

    try {
      if (isEditMode) {
        await axiosInstance.put(
          `/accounts/department-update-delete/${departmentId}/`,
          formData
        );
      } else {
        await axiosInstance.post("/accounts/department-createlist/", formData);
      }

      // Transition to Success state in the dialog
      setIsDone(true);

      // Removed the setTimeout; navigation is now handled by the Continue button
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.response?.data?.detail || "Failed to save department");
      // Close dialog on error so the user can see the alert message
      setIsSaving(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/configurations/accounts/departments");
  };

  return (
    <div className="form-container">
      {/* Dialog Box Configuration */}
      <SaveDialogbox
        isOpen={isSaving}
        isComplete={isDone}
        title={isDone ? "Success" : isEditMode ? "Updating..." : "Saving..."}
        subtitle={
          isDone & isEditMode
            ? "The department information has been updated successfully."
            : "The department information has been recorded successfully."
        }
        onClose={() => {
          setIsSaving(false);
          navigate("/configurations/accounts/departments");
        }}
      />

      <div className="form-header">
        <h2>{isEditMode ? "Edit Department" : "Add Department"}</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="name">Department Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            maxLength="100"
            placeholder="Enter department name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter department description"
            rows="4"
          />
        </div>

        <div className="form-group checkbox-group">
          <label htmlFor="executive">
            <input
              type="checkbox"
              id="executive"
              name="executive"
              checked={formData.executive}
              onChange={handleInputChange}
            />
            <span>
              Executive Department (Users can view all agreements but cannot
              create or edit)
            </span>
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Saving..." : isEditMode ? "Update Department" : "Save"}
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

export default DepartmentForm;
