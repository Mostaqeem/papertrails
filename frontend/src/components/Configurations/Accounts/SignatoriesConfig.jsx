import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import editIcon from '../../../assets/icons/edit.svg';
import deleteIcon from '../../../assets/icons/trash.svg';
import axiosInstance from '../../../axiosConfig';

/**
 * SignatoriesConfig - Configuration page for managing signatories
 */
const SignatoriesConfig = () => {
  const navigate = useNavigate();
  const [signatories, setSignatories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSignatories();
  }, []);

const fetchSignatories = async () => {
  setLoading(true);
  setError(null);
  try {
    // FIX: The router prefix is 'signatories', not 'signatories-createlist'
    const response = await axiosInstance.get("/accounts/signatory-crud/");

    console.log("Signatories response:", response.data);

    let signatoriesList = Array.isArray(response.data)
      ? response.data
      : response.data?.results || [];

    setSignatories(signatoriesList);
  } catch (err) {
    console.error("Error fetching signatories:", err);
    setError("Failed to fetch signatories");
    setSignatories([]);
  } finally {
    setLoading(false);
  }
};

  const handleAddSignatory = () => {
    navigate('/configurations/accounts/signatories/add');
  };

  const handleEdit = (sigId) => {
    navigate(`/configurations/accounts/signatories/${sigId}/edit`);
  };

const handleDelete = async (sigId) => {
  if (!window.confirm("Are you sure you want to delete this signatory?"))
    return;
  try {
    // FIX: Must include the ID in the DELETE path
    await axiosInstance.delete(`/accounts/signatory-crud/${sigId}/`);
    setSignatories(signatories.filter((sig) => sig.id !== sigId));
  } catch (err) {
    setError("Failed to delete signatory");
  }
};

  return (
    <div className="config-page">
      <div className="config-header">
        <h2>Signatories Configuration</h2>
        <button className="btn btn-add " onClick={handleAddSignatory}>
          Add New
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div>Loading signatories...</div>
      ) : (
        <div className="config-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                {/* <th>Email</th> */}
                <th>Designation</th>
                <th>Digital Signature</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {signatories.map((sig) => (
                <tr key={sig.id}>
                  {/* sig.full_name is provided by the SignatorySerializer MethodField/Source */}
                  <td>{sig.full_name || "N/A"}</td>

                  {/* sig.email is an object in your serializer, need to access .email property */}
                  {/* <td>{sig.email?.email || "N/A"}</td> */}

                  <td>{sig.designation || "No Designation"}</td>

                  <td>
                    {sig.digital_signature_url ? (
                      <a
                        href={sig.digital_signature_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Signature
                      </a>
                    ) : (
                      "None"
                    )}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="icon-btn edit-btn"
                      onClick={() => handleEdit(sig.id)}
                    >
                      <img src={editIcon} alt="Edit" />
                    </button>
                    <button
                      className="icon-btn delete-btn"
                      onClick={() => handleDelete(sig.id)}
                    >
                      <img src={deleteIcon} alt="Delete" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SignatoriesConfig;
