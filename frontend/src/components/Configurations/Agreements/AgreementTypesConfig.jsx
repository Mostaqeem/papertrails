import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import editIcon from '../../../assets/icons/edit.svg';
import deleteIcon from '../../../assets/icons/trash.svg';
import axiosInstance from '../../../axiosConfig';
import '../ConfigurationLayout.css';

/**
 * AgreementTypesConfig - Configuration page for managing agreement types
 */
const AgreementTypesConfig = () => {
  const navigate = useNavigate();
  const [agreementTypes, setAgreementTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAgreementTypes();
  }, []);

  const fetchAgreementTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/agreements/agreement-types/");
      console.log("Agreement types response:", response.data);

      // Handle both array and paginated responses
      let typesList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setAgreementTypes(typesList);
    } catch (err) {
      console.error("Error fetching agreement types:", err);
      setError("Failed to fetch agreement types");
      setAgreementTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddType = () => {
    navigate("/configurations/agreements/types/add");
  };

  const handleEdit = (typeId) => {
    navigate(`/configurations/agreements/types/${typeId}/edit`);
  };

  const handleDelete = async (typeId) => {
    if (!window.confirm("Are you sure you want to delete this agreement type?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/agreements/agreement-types/${typeId}/`);
      setAgreementTypes(agreementTypes.filter((type) => type.id !== typeId));
      setError(null);
    } catch (err) {
      console.error("Error deleting agreement type:", err);
      setError("Failed to delete agreement type. Please try again later.");
    }
  };

  return (
    <div className="config-page">
      <div className="config-header">
        <h2>Agreement Types Configuration</h2>
        <button className="btn btn-add " onClick={handleAddType}>Add New</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div>Loading agreement types...</div>
      ) : (
        <div className="config-table">
          <table>
            <thead>
              <tr>
                <th>Type Name</th>
                <th>Description</th>
                <th>Status</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agreementTypes.length === 0 ? (
                <tr>
                  <td colSpan="4">No agreement types configured yet.</td>
                </tr>
              ) : (
                agreementTypes.map((type) => (
                  <tr key={type.id}>
                    <td>{type.name}</td>
                    <td>{type.description}</td>
                    <td>{type.is_active ? "Active" : "Inactive"}</td>
                    <td className="actions-cell">
                      <button
                        className="icon-btn edit-btn"
                        title="Edit"
                        onClick={() => handleEdit(type.id)}
                      >
                        <img src={editIcon} alt="Edit" />
                      </button>
                      <button
                        className="icon-btn delete-btn"
                        title="Delete"
                        onClick={() => handleDelete(type.id)}
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

export default AgreementTypesConfig;
