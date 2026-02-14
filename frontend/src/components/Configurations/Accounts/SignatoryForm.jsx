import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../axiosConfig";
import SaveDialogbox from "../SaveDialogbox"; //
import "./Form.css";

const SignatoryForm = () => {
  const navigate = useNavigate();
  const { signatoryId } = useParams();
  const isEditMode = !!signatoryId;

  const [formData, setFormData] = useState({
    email: "",
    digital_signature: null,
    file_name: "",
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New Dialog Box States
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const [signaturePreview, setSignaturePreview] = useState(null);

  useEffect(() => {
    fetchUsers();
    if (isEditMode) {
      fetchSignatory();
    }
  }, [signatoryId]);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/accounts/users-config/");
      setUsers(response.data.results || []);
    } catch (err) {
      setError("Failed to load users");
      setUsers([]);
    }
  };

  const fetchSignatory = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/accounts/signatory-crud/${signatoryId}/`
      );
      const signatureUrl = response.data.digital_signature_url;
      setFormData({
        email: response.data.email?.id || "",
        digital_signature: response.data.digital_signature || null,
        fileName: signatureUrl ? signatureUrl.split("/").pop() : "",
      });
      if (signatureUrl) {
        setSignaturePreview(signatureUrl);
      }
    } catch (err) {
      setError("Failed to load signatory details");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      email: e.target.value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setFormData((prev) => ({
        ...prev,
        digital_signature: file,
        fileName: file.name,
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Open dialog box
    setIsSaving(true);
    setIsDone(false);

    try {
      if (!formData.email) {
        setError("Please select a user");
        setIsSaving(false); // Close dialog on validation error
        setLoading(false);
        return;
      }

      const submitData = new FormData();
      submitData.append("email_id", formData.email);

      if (formData.digital_signature instanceof File) {
        submitData.append("digital_signature", formData.digital_signature);
      } else if (!isEditMode) {
        setError("Digital signature is required for new signatories");
        setIsSaving(false); // Close dialog on validation error
        setLoading(false);
        return;
      }

      if (isEditMode) {
        await axiosInstance.patch(
          `/accounts/signatory-crud/${signatoryId}/`,
          submitData
        );
      } else {
        await axiosInstance.post("/accounts/signatory-crud/", submitData);
      }

      // Transition dialog to green success state
      setIsDone(true);

      // Automatic navigate timeout removed; logic moved to onClose
    } catch (err) {
      console.error("Error response:", err.response?.data);
      setError(
        err.response?.data?.email?.[0]
          ? err.response.data.email[0]
          : err.response?.data?.digital_signature?.[0]
          ? err.response.data.digital_signature[0]
          : "Failed to save signatory"
      );
      setIsSaving(false); // Hide dialog so user can read error alert
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      {/* Success Dialog Box Configuration */}
      <SaveDialogbox
        isOpen={isSaving}
        isComplete={isDone}
        title={isDone ? "Success" : isEditMode ? "Updating..." : "Saving..."}
        subtitle={
          isDone & isEditMode
            ? "Signatory details have been updated successfully."
            : "Signatory details and digital signature have been saved successfully."
        }
        onClose={() => {
          setIsSaving(false);
          navigate("/configurations/accounts/signatories");
        }}
      />

      <h2>{isEditMode ? "Edit Signatory" : "Add Signatory"}</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>User *</label>
          <select value={formData.email} onChange={handleEmailChange} required>
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Digital Signature {isEditMode ? "" : "*"}</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required={!isEditMode}
          />

          {formData.fileName && (
            <div
              className="file-info"
              style={{ marginTop: "5px", fontSize: "0.85rem", color: "#555" }}
            >
              <strong>Current file:</strong> {formData.fileName}
            </div>
          )}

          <small className="help-text">
            Upload a clear image of the signature (PNG, JPG).
          </small>
        </div>

        {signaturePreview && (
          <div
            className="signature-preview-container"
            style={{ marginBottom: "20px" }}
          >
            <p>Signature Preview:</p>
            <img
              src={signaturePreview}
              alt="Digital Signature"
              style={{
                maxWidth: "200px",
                border: "1px solid #ddd",
                padding: "5px",
                borderRadius: "4px",
              }}
            />
          </div>
        )}

        <div
          className="form-actions"
          style={{ display: "flex", gap: "10px", marginTop: "20px" }}
        >
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Saving..." : isEditMode ? "Update" : "Save"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/configurations/accounts/signatories")}
            style={{ backgroundColor: "#6c757d", color: "white" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignatoryForm;
