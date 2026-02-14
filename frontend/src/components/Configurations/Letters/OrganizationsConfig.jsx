import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import editIcon from "../../../assets/icons/edit.svg";
import deleteIcon from "../../../assets/icons/trash.svg";
import axiosInstance from "../../../axiosConfig";

/**
 * OrganizationsConfig - Configuration page for managing organizations
 */
const OrganizationsConfig = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: Fetch organizations from API
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
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
      setError("Failed to fetch organizations");
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrganization = () => {
    navigate("/configurations/letters/organizations/add");
  };
  const handleEdit = (orgId) => {
    navigate(`/configurations/letters/organizations/${orgId}/edit`);
  };
  const handleDelete = async (orgId) => {
    if (!window.confirm("Are you sure you want to delete this organization?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/letters/organizations_crud/${orgId}/`);
      setOrganizations(organizations.filter((org) => org.id !== orgId));
      setError(null);
    } catch (err) {
      console.error("Error deleting organization:", err);
      setError("Failed to delete organization");
    }
  };

  return (
    <div className="config-page">
      <div className="config-header">
        <h2>Organizations Configuration</h2>
        <button
          className="btn btn-add "
          onClick={() => handleAddOrganization()}
        >
          Add New
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div>Loading organizations...</div>
      ) : (
        <div className="config-table">
          <table>
            <thead>
              <tr>
                <th>Organization Name</th>
                <th>Organization Short Form</th>
                <th>Organization Type</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan="3">No organizations configured yet.</td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <tr key={org.id}>
                    <td>{org.name}</td>
                    <td>{org.short_form}</td>
                    <td>{org.organization_type}</td>
                    <td className="actions-cell">
                      <button
                        className="icon-btn edit-btn"
                        title="Edit"
                        onClick={() => handleEdit(org.id)}
                      >
                        <img src={editIcon} alt="Edit" />
                      </button>
                      <button
                        className="icon-btn delete-btn"
                        title="Delete"
                        onClick={() => handleDelete(org.id)}
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

export default OrganizationsConfig;
