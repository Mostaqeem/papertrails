import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import editIcon from "../../../assets/icons/edit.svg";
import deleteIcon from "../../../assets/icons/trash.svg";
import axiosInstance from "../../../axiosConfig";
/**
 * RecipientsConfig - Configuration page for managing letter recipients
 */
const RecipientsConfig = () => {
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/letters/recipients_crud/");
      console.log("Recipients response:", response.data);
      let recipientsList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      console.log("Parsed recipients list:", recipientsList);
      setRecipients(recipientsList);
    } catch (err) {
      console.error("Error fetching recipients:", err);
      setError("Failed to fetch recipients");
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipient = () => {
    navigate("/configurations/letters/recipients/add");
  };

  const handleEdit = (recId) => {
    navigate(`/configurations/letters/recipients/${recId}/edit`);
  };

  const handleDelete = async (recId) => {
    if (!window.confirm("Are you sure you want to delete this recipient?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/letters/recipients_crud/${recId}/`);
      setRecipients(recipients.filter((rec) => rec.id !== recId));
      setError(null);
    } catch (err) {
      console.error("Error deleting recipient:", err);
      setError("Failed to delete recipient");
    }
  };

  return (
    <div className="config-page">
      <div className="config-header">
        <h2>Recipients Configuration</h2>
        <button
          className="btn btn-add "
          onClick={() => handleAddRecipient()}
        >
          Add New
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div>Loading recipients...</div>
      ) : (
        <div className="config-table">
          <table>
            <thead>
              <tr>
                <th>Recipient Name</th>
                <th>Email</th>
                <th>Organization</th>
                <th>Department</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipients.length === 0 ? (
                <tr>
                  <td colSpan="4">No recipients configured yet.</td>
                </tr>
              ) : (
                recipients.map((rec) => (
                  <tr key={rec.id}>
                    <td>{rec.name}</td>
                    <td>{rec.email}</td>
                    <td>{rec.organization_name}</td>
                    <td>{rec.department || "N/A"}</td>
                    <td className="actions-cell">
                      <button
                        className="icon-btn edit-btn"
                        title="Edit"
                        onClick={() => handleEdit(rec.id)}
                      >
                        <img src={editIcon} alt="Edit" />
                      </button>
                      <button
                        className="icon-btn delete-btn"
                        title="Delete"
                        onClick={() => handleDelete(rec.id)}
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

export default RecipientsConfig;
