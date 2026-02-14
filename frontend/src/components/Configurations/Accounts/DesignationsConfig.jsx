import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import editIcon from "../../../assets/icons/edit.svg";
import deleteIcon from "../../../assets/icons/trash.svg";
import axiosInstance from "../../../axiosConfig";

/**
 * DesignationsConfig - Configuration page for managing designations
 */
const DesignationsConfig = () => {
  const navigate = useNavigate();
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        "/accounts/designations-createlist/"
      );
      console.log("Designations response:", response.data);

      // Handle both array and paginated responses
      let designationsList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setDesignations(designationsList);
    } catch (err) {
      console.error("Error fetching designations:", err);
      setError("Failed to fetch designations");
      setDesignations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDesignation = () => {
    navigate("/configurations/accounts/designations/add");
  };

  const handleEdit = (desId) => {
    navigate(`/configurations/accounts/designations/${desId}/edit`);
  };

  const handleDelete = async (desId) => {
    console.log("Delete designation:", desId);
    if (!window.confirm("Are you sure you want to delete this designation?")) {
      return;
    }
    try {
      await axiosInstance.delete(
        `/accounts/designation-update-delete/${desId}/`
      );
      setDesignations(designations.filter((des) => des.id !== desId));
      setError(null);
    } catch (err) {
      console.error("Error deleting designation:", err);
      setError("Failed to delete designation");
    }
  };

  return (
    <div className="config-page">
      <div className="config-header">
        <h2>Designations Configuration</h2>
        <button className="btn btn-add " onClick={handleAddDesignation}>Add New</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div>Loading designations...</div>
      ) : (
        <div className="config-table">
          <table>
            <thead>
              <tr>
                <th>Designation</th>
                <th>Short Form</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {designations.length === 0 ? (
                <tr>
                  <td colSpan="4">No designations configured yet.</td>
                </tr>
              ) : (
                designations.map((des) => (
                  <tr key={des.id}>
                    <td>{des.designation}</td>
                    <td>{des.short_designation}</td>
                    <td className="actions-cell">
                      <button
                        className="icon-btn edit-btn"
                        title="Edit"
                        onClick={() => handleEdit(des.id)}
                      >
                        <img src={editIcon} alt="Edit" />
                      </button>
                      <button
                        className="icon-btn delete-btn"
                        title="Delete"
                        onClick={() => handleDelete(des.id)}
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

export default DesignationsConfig;
