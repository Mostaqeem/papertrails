import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../axiosConfig";
import SaveDialogbox from "../SaveDialogbox";

const UserForm = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

  // Removed password from initial state
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    department: "",
    designation: "",
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [isDone, setIsDone] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchDropdownData();
    if (userId) {
      fetchUserData(userId);
    }
  }, [userId]);

  const fetchDropdownData = async () => {
    try {
      const [deptsRes, desigsRes] = await Promise.all([
        axiosInstance.get("accounts/departments/"),
        axiosInstance.get("accounts/designations-createlist/"),
      ]);

      const deptsData = Array.isArray(deptsRes.data)
        ? deptsRes.data
        : deptsRes.data.results;
      const desigsData = Array.isArray(desigsRes.data)
        ? desigsRes.data
        : desigsRes.data.results;

      setDepartments(deptsData || []);
      setDesignations(desigsData || []);
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
    }
  };

  const fetchUserData = async (id) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`accounts/users-config/${id}/`);
      setFormData({
        email: response.data.email || "",
        full_name: response.data.full_name || "",
        department: response.data.department || "",
        designation: response.data.designation || "",
        is_active: response.data.is_active ?? true,
      });
    } catch (err) {
      setError("Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setIsEditMode(true);
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsDone(false);
    setIsSaving(true);

    try {
      // Logic simplified: No need to check or delete passwords anymore
      if (userId) {
        await axiosInstance.put(`accounts/users-config/${userId}/`, formData);
      } else {
        await axiosInstance.post("accounts/users-config/", formData);
      }
      // navigate("/user-management/all-users");
      setIsDone(true);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to save user"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && userId) return <div>Loading...</div>;

  return (
    <div className="form-container">
      <SaveDialogbox
        isOpen={isSaving}
        isComplete={isDone}
        // Change text dynamically once saving is finished
        title={isDone ? "Success" : isEditMode ? "Updating..." : "Saving..."}
        subtitle={
          isDone & isEditMode
            ? "User information has been updated successfully."
            : "User information has been saved successfully."
        }
        // This is the function that runs when "Continue" is clicked
        onClose={() => {
          setIsSaving(false);
          navigate("/user-management/all-users");
        }}
      />
      <h2>{userId ? "Edit User" : "Add New User"}</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={!!userId}
          />
        </div>

        {/* Password input removed completely */}

        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="full_name">Full Name *</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Department */}
        <div className="form-group">
          <label htmlFor="department">Department *</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="designation">Designation</label>
          <select
            name="designation"
            value={formData.designation}
            onChange={handleChange}
          >
            <option value="">Select Designation</option>
            {designations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.designation || d.short_designation}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            Active
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/user-management/all-users")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;