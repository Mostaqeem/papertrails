import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../axiosConfig';
import './AgreementPreview.css'; // <--- Import the CSS file here

export default function AgreementPreview({
  data,
  vendors = [],
  departments = [],
  agreementTypes = [],
  availableAgreements = [],
  onSave,
  onEdit,
  viewMode,
  onDataChange,
  onTestReminder,
  isTestingReminder
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedVendor, setSelectedVendor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usersWithAccess, setUsersWithAccess] = useState([]);

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (error) {
      return dateString;
    }
  };

  // Agreement Type Logic
  const [agreementTypeLabel, setAgreementTypeLabel] = useState('');
  useEffect(() => {
    if (!data) return;
    let typeValue = data.agreement_type;

    if (data.agreement_type_name) {
      setAgreementTypeLabel(data.agreement_type_name);
      return;
    }

    if (typeof typeValue === 'object' && typeValue?.name) {
      setAgreementTypeLabel(typeValue.name);
    } else if ((typeof typeValue === 'number' || !isNaN(Number(typeValue))) && agreementTypes.length > 0) {
      const foundType = agreementTypes.find(t => String(t.id) === String(typeValue));
      setAgreementTypeLabel(foundType ? foundType.name : 'Not specified');
    } else if (typeof typeValue === 'string' && typeValue.trim() !== '') {
      const foundType = agreementTypes.find(t => String(t.id) === typeValue);
      setAgreementTypeLabel(foundType ? foundType.name : typeValue);
    } else {
      setAgreementTypeLabel('Not specified');
    }
  }, [data?.agreement_type, data?.agreement_type_name, agreementTypes]);

  // Ensure vendors and departments are arrays
  const vendorsArray = vendors?.results || [];
  const departmentsArray = Array.isArray(departments) ? departments : [];

  // Find the vendor name logic
  let partyName = data?.party_name || data?.partyName;
  if (vendorsArray.length && partyName && (typeof partyName === 'number' || !isNaN(Number(partyName)))) {
    const found = vendorsArray.find(v => String(v.id) === String(partyName));
    if (found) partyName = found.name;
  }

  useEffect(() => {
    if (partyName) setSelectedVendor(partyName);
  }, [partyName]);

  // Attachment logic
  let attachmentLink = null;
  let attachmentName = '';
  if (data?.attachment) {
    attachmentLink = data.attachment;
    attachmentName = data.original_filename || (typeof data.attachment === 'string' ? data.attachment.split('/').pop() : data.attachment.name);
  }

  // Department Display Logic
  let departmentDisplay = data?.department_name;
  if (departmentsArray && departmentsArray.length > 0) {
    if (typeof data?.department === 'number' || (typeof data?.department === 'string' && !isNaN(Number(data?.department)))) {
      const foundDept = departmentsArray.find(d => String(d.id) === String(data?.department));
      if (foundDept) departmentDisplay = foundDept.name;
    } else if (typeof data?.department === 'object' && data?.department?.name) {
      departmentDisplay = data.department.name;
    }
  }

  // Save/Submit Logic
  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (onSave) {
        await onSave();
        return;
      }

      let endpoint = 'api/agreements/submit/';
      let method = 'post';
      let payload;
      let config;

      // EDIT MODE
      if (data.id || data.agreementId) {
        const agreementId = data.id || data.agreementId;
        endpoint = `api/agreements/edit/${agreementId}/`;
        method = 'put';
        payload = {
          title: data.agreementTitle || data.title,
          agreement_reference: data.agreementReference || data.agreement_reference,
          agreement_type: data.agreement_type?.id || data.agreement_type,
          department: data.department?.id || data.department,
          parent_agreement: data.parent_agreement?.id || data.parent_agreement,
          party_name: data.party_name,
          start_date: data.startDate || data.start_date,
          expiry_date: data.expiryDate || data.expiry_date,
          reminder_time: data.reminderDate || data.reminder_time,
        };
        if (data.attachment && typeof data.attachment === 'string') payload.attachment_path = data.attachment;
        config = { headers: { 'Content-Type': 'application/json' } };
      }
      // CREATE MODE
      else {
        payload = new FormData();
        payload.append('title', data.agreementTitle || data.title);
        payload.append('agreement_reference', data.agreementReference || data.agreement_reference);
        payload.append('agreement_type', typeof data.agreement_type === 'object' ? data.agreement_type.id : data.agreement_type);
        payload.append('department', typeof data.department === 'object' ? data.department.id : data.department);
        payload.append('parent_agreement', typeof data.parent_agreement === 'object' ? data.parent_agreement.id : data.parent_agreement);
        payload.append('party_name', data.party_name);
        payload.append('start_date', data.startDate || data.start_date);
        payload.append('expiry_date', data.expiryDate || data.expiry_date);
        payload.append('reminder_time', data.reminderDate || data.reminder_time);
        if (data.attachment) {
          if (typeof data.attachment === 'string') payload.append('attachment_path', data.attachment);
          else payload.append('attachment', data.attachment);
        }
        config = { headers: { 'Content-Type': 'multipart/form-data' } };
      }

      const response = await axiosInstance[method](endpoint, payload, config);
      if (response.data.success) navigate('/agreements');
      else alert('Error saving agreement: ' + response.data.message);
    } catch (error) {
      alert('Error submitting agreement. Please try again.');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch users with access
  useEffect(() => {
    const agreementId = data?.id || id;
    if (agreementId) {
      axiosInstance.get(`/agreements/${agreementId}/users-with-access/`)
        .then(res => setUsersWithAccess(res.data.assigned_users || []))
        .catch(() => setUsersWithAccess([]));
    } else if (data?.availableUsers && Array.isArray(data.availableUsers) && data?.department) {
      const deptId = typeof data.department === 'object' ? data.department.id : data.department;
      const filtered = data.availableUsers.filter(u =>
        String(u.department) === String(deptId) ||
        String(u.department_id) === String(deptId) ||
        String(u.department?.id) === String(deptId) ||
        String(u.department__id) === String(deptId)
      );
      setUsersWithAccess(filtered);
    } else if (data?.department && !viewMode) {
      const deptId = typeof data.department === 'object' ? data.department.id : data.department;
      axiosInstance.get(`/agreements/form-data/`)
        .then(res => {
          const allUsers = res.data.available_users || [];
          const deptUsers = allUsers.filter(u =>
            String(u.department) === String(deptId) ||
            String(u.department_id) === String(deptId) ||
            String(u.department?.id) === String(deptId) ||
            String(u.department__id) === String(deptId)
          );
          setUsersWithAccess(deptUsers);
        })
        .catch(() => setUsersWithAccess([]));
    }
  }, [data?.id, id, data?.department, data?.availableUsers, viewMode]);

  return (
    <div className="agreement-preview-container">
      <h2 className="preview-title">Agreement Details</h2>

      {/* Row 1: Agreement ID, Agreement Reference, Type */}
      <div className="preview-grid-3">
        <div>
          <label className="field-label">Agreement ID</label>
          <div className="field-value">
            {data?.agreement_id || 'Not assigned yet'}
          </div>
        </div>
        <div>
          <label className="field-label">Agreement Reference</label>
          <div className="field-value">
            {data?.agreementReference || data?.agreement_reference}
          </div>
        </div>
        <div>
          <label className="field-label">Type</label>
          <div className="field-value">
            {agreementTypeLabel || <em>Not specified</em>}
          </div>
        </div>
      </div>

      {/* Row 2: Agreement Title */}
      <div className="form-group">
        <label className="field-label">Agreement Title</label>
        <div className="field-value">
          {data?.agreementTitle || data?.title}
        </div>
      </div>

      {/* Row 3: Start Date, Expiry Date, Reminder Date */}
      <div className="preview-grid-3">
        <div>
          <label className="field-label">Start Date</label>
          <div className="field-value">
            {formatDate(data?.startDate || data?.start_date)}
          </div>
        </div>
        <div>
          <label className="field-label">Expiry Date</label>
          <div className="field-value">
            {formatDate(data?.expiryDate || data?.expiry_date)}
          </div>
        </div>
        <div>
          <label className="field-label">Reminder Date</label>
          <div className="field-value">
            {formatDate(data?.reminderDate || data?.reminder_time)}
          </div>
        </div>
      </div>

      {/* Row 4: Department, Status, Created By */}
      <div className="preview-grid-3">
        <div>
          <label className="field-label">Department</label>
          <div className="field-value">
            {departmentDisplay || <em>Not specified</em>}
          </div>
        </div>
        <div>
          <label className="field-label">Status</label>
          <div className="field-value">
            {data?.status || 'Active'}
          </div>
        </div>
        <div>
          <label className="field-label">Created By</label>
          <div className="field-value">
            {data?.creator_name || data?.created_by || <em>Not specified</em>}
          </div>
        </div>
      </div>

      {/* Attachment */}
      <div className="form-group">
        <label className="field-label">Attachment</label>
        <div className="field-value">
          {attachmentLink ? (
            <a href={attachmentLink} target="_blank" rel="noopener noreferrer" download={attachmentName} className="preview-link">
              {attachmentName}
            </a>
          ) : 'No file uploaded'}
        </div>
      </div>

      {/* Departmental Users */}
      {usersWithAccess && usersWithAccess.length > 0 && (
        <div className="form-group">
          <label className="field-label">Departmental Users</label>
          <div className="field-value tags-container">
            {usersWithAccess.map((u) => (
              <span key={u.id} className="user-tag">
                {u.full_name}
                {u.department__name ? ` (${u.department__name})` : ''}
                <span className="tag-remove">×</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Executive Users */}
      {data?.executive_users && data.executive_users.length > 0 && (
        <div className="form-group">
          <label className="field-label">Executive Users</label>
          <div className="field-value tags-container">
            {data.executive_users.map(u => (
              <span key={u.id} className="user-tag executive">
                {u.full_name} {u.department__name ? `(${u.department__name})` : ''}
                <span className="tag-remove">×</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Parent Agreement */}
      <div className="form-group">
        <label className="field-label">Parent Agreement</label>
        <div className="field-value">
          {(() => {
            const parentAgreement = data?.parent_agreement;
            if (!parentAgreement) return <span>No Parent</span>;

            if (typeof parentAgreement === 'object' && parentAgreement.title) {
              return (
                <a href={`/agreements/preview/${parentAgreement.id}`} target="_blank" rel="noopener noreferrer" className="preview-link">
                  {parentAgreement.agreement_id ? `${parentAgreement.agreement_id} - ${parentAgreement.title}` : parentAgreement.title}
                </a>
              );
            }

            if (availableAgreements && availableAgreements.length > 0) {
              const foundParent = availableAgreements.find(a => String(a.id) === String(parentAgreement));
              if (foundParent) {
                return (
                  <a href={`/agreements/preview/${foundParent.id}`} target="_blank" rel="noopener noreferrer" className="preview-link">
                    {foundParent.agreement_id ? `${foundParent.agreement_id} - ${foundParent.title}` : foundParent.title}
                  </a>
                );
              }
            }
            return <span>No Parent</span>;
          })()}
        </div>
      </div>

      {/* Child Agreements */}
      {viewMode && (
        <div className="form-group">
          <label className="field-label">Child Agreement</label>
          <div className="field-value">
            {data?.child_agreements && data.child_agreements.length > 0 ? (
              data.child_agreements.map((agreement, index) => (
                <div key={agreement.id} style={{ marginBottom: index < data.child_agreements.length - 1 ? '8px' : '0' }}>
                  <a href={`/agreements/preview/${agreement.id}`} target="_blank" rel="noopener noreferrer" className="preview-link">
                    {agreement.agreement_id ? `${agreement.agreement_id} - ${agreement.title}` : agreement.title}
                  </a>
                </div>
              ))
            ) : (
              <span>No Child Agreements</span>
            )}
          </div>
        </div>
      )}

      {/* Remarks */}
      <div className="form-group">
        <label className="field-label">Remarks</label>
        <div className="field-value remarks-box">
          {data?.remarks || <em>No remarks provided</em>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="button-group">
        {viewMode ? (
          <button className="btn btn-primary" onClick={() => navigate('/agreements')}>
            Back
          </button>
        ) : (
          <>
            <button className="btn btn-primary" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button className="btn btn-secondary" onClick={onEdit}>
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
