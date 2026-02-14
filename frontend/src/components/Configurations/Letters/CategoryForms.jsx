import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../axiosConfig";
import SaveDialogbox from "../SaveDialogbox";
import "../Accounts/Form.css";

/**
 * CategoryForm - Form for adding/editing letter categories
 */
const CategoryForm = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const isEditMode = !!categoryId;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Fetch category if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchCategory();
    }
  }, [categoryId]);

  const fetchCategory = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/letters/categories_crud/${categoryId}/`
      );
      setFormData({
        name: response.data.name || "",
        description: response.data.description || "",
      });
    } catch (err) {
      console.error("Error fetching category:", err);
      setError("Failed to load category details");
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
          `/letters/categories_crud/${categoryId}/`,
          formData
        );
      } else {
        await axiosInstance.post("/letters/categories_crud/", formData);
      }

      setIsDone(true);
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.response?.data?.detail || "Failed to save category");
      setIsSaving(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/configurations/letters/categories");
  };

  return (
    <div className="form-container">
      <SaveDialogbox
        isOpen={isSaving}
        isComplete={isDone}
        title={isDone ? "Success" : isEditMode ? "Updating..." : "Saving..."}
        subtitle={
          isDone && isEditMode
            ? "Category has been updated successfully."
            : "Category has been saved successfully."
        }
        onClose={() => {
          setIsSaving(false);
          navigate("/configurations/letters/categories");
        }}
      />

      <div className="form-header">
        <h2>{isEditMode ? "Edit Category" : "Add Category"}</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="name">Category Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            maxLength="255"
            placeholder="Enter category name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter category description"
            rows="4"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading
              ? "Saving..."
              : isEditMode
              ? "Update Category"
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

export default CategoryForm;
