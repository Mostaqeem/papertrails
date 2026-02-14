import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import editIcon from "../../../assets/icons/edit.svg";
import deleteIcon from "../../../assets/icons/trash.svg";
import axiosInstance from "../../../axiosConfig";

/**
 * DepartmentsConfig - Configuration page for managing departments
 */
const DepartmentsConfig = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        "/accounts/department-createlist/"
      );
      console.log("Departments response:", response.data);

      // Handle both array and paginated responses
      let departmentsList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setDepartments(departmentsList);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError("Failed to load departments. Please try again later.");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = () => {
    navigate("/configurations/accounts/departments/add");
  };

  const handleEdit = (deptId) => {
    navigate(`/configurations/accounts/departments/${deptId}/edit`);
  };

  const handleDelete = async (deptId) => {
    console.log("Delete department:", deptId);
    if (!window.confirm("Are you sure you want to delete this department?")) {
      return;
    }
    try {
      await axiosInstance.delete(
        `/accounts/department-update-delete/${deptId}/`
      );
      setDepartments(departments.filter((dept) => dept.id !== deptId));
      setError(null);
    } catch (err) {
      console.error("Error deleting department:", err);
      setError("Failed to delete department. Please try again later.");
    }
  };

  return (
    <div className="config-page">
      <div className="config-header">
        <h2>Departments Configuration</h2>
        <button className="btn btn-add " onClick={handleAddDepartment}>Add New</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div>Loading departments...</div>
      ) : (
        <div className="config-table">
          <table>
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Description</th>
                <th>Executive</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan="4">No departments configured yet.</td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id}>
                    <td>{dept.name}</td>
                    <td>{dept.description}</td>
                    <td>{dept.executive ? "Yes" : "No"}</td>
                    <td className="actions-cell">
                      <button
                        className="icon-btn edit-btn"
                        title="Edit"
                        onClick={() => handleEdit(dept.id)}
                      >
                        <img src={editIcon} alt="Edit" />
                      </button>
                      <button
                        className="icon-btn delete-btn"
                        title="Delete"
                        onClick={() => handleDelete(dept.id)}
                      >
                        <img src={deleteIcon} alt="Delete" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DepartmentsConfig;
