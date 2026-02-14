import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import editIcon from "../../../assets/icons/edit.svg";
import deleteIcon from "../../../assets/icons/trash.svg";
import axiosInstance from "../../../axiosConfig";

/**
 * VendorsConfig - Configuration page for managing vendors
 */
const VendorsConfig = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/agreements/vendors/");
      console.log("Vendors response:", response.data);

      // Handle both array and paginated responses
      let vendorsList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setVendors(vendorsList);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError("Failed to fetch vendors");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = () => {
    navigate("/configurations/agreements/vendors/add");
  };

  const handleEdit = (vendorId) => {
    navigate(`/configurations/agreements/vendors/${vendorId}/edit`);
  };

  const handleDelete = async (vendorId) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/agreements/vendors/${vendorId}/`);
      setVendors(vendors.filter((vendor) => vendor.id !== vendorId));
      setError(null);
    } catch (err) {
      console.error("Error deleting vendor:", err);
      setError("Failed to delete vendor. Please try again later.");
    }
  };

  return (
    <div className="config-page">
      <div className="config-header">
        <h2>Vendors Configuration</h2>
        <button className="btn btn-add " onClick={handleAddVendor}>Add New</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div>Loading vendors...</div>
      ) : (
        <div className="config-table">
          <table>
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan="4">No vendors configured yet.</td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td>{vendor.name}</td>
                    <td>{vendor.contact_person_name || "-"}</td>
                    <td>{vendor.email}</td>
                    <td className="actions-cell">
                      <button
                        className="icon-btn edit-btn"
                        title="Edit"
                        onClick={() => handleEdit(vendor.id)}
                      >
                        <img src={editIcon} alt="Edit" />
                      </button>
                      <button
                        className="icon-btn delete-btn"
                        title="Delete"
                        onClick={() => handleDelete(vendor.id)}
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

export default VendorsConfig;
