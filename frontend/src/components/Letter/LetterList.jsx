// src/pages/LetterList/LetterList.jsx
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useNavigate } from 'react-router-dom';
import { useLetterContext } from '../../context/LetterContext';
import '../../App.css';
import './LetterList.css';
import downloadIcon from '../../assets/icons/download.svg';
import viewIcon from '../../assets/icons/view.svg';
import axiosInstance from '../../axiosConfig';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const LettersPage = () => {
  const { letters, isLoading, error, setLetters, setIsLoading, setError } = useLetterContext();
  const [localLetters, setLocalLetters] = useState([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedLetterFiles, setSelectedLetterFiles] = useState([]);
  const navigate = useNavigate();

  // Filter state
  const [refNumber, setRefNumber] = useState('');
  const [organization, setOrganization] = useState('');
  const [designation, setDesignation] = useState('');
  const [category, setCategory] = useState('');
  const [signatory, setSignatory] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [textContent, setTextContent] = useState('');

  // Dropdown dynamic options
  const [organizations, setOrganizations] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [signatories, setSignatories] = useState([]);

  /* ------------------------------
     CALCULATE DYNAMIC STATS
  ------------------------------ */
  const stats = useMemo(() => {
    if (!letters || letters.length === 0) {
      return { today: 0, week: 0, year: 0 };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Calculate start of the week (Sunday as start)
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());

    let todayCount = 0;
    let weekCount = 0;
    let yearCount = 0;

    letters.forEach(letter => {
      const letterDate = new Date(letter.created_at);

      // Reset time portion for accurate date comparison
      const letterDateOnly = new Date(letterDate.getFullYear(), letterDate.getMonth(), letterDate.getDate());

      // Check Today
      if (letterDateOnly.getTime() === todayStart.getTime()) {
        todayCount++;
      }

      // Check This Week (>= Sunday)
      if (letterDateOnly >= weekStart) {
        weekCount++;
      }

      // Check This Year (>= Jan 1st)
      if (letterDateOnly >= yearStart) {
        yearCount++;
      }
    });

    return { today: todayCount, week: weekCount, year: yearCount };
  }, [letters]);

  /* ------------------------------
     LOAD LETTERS
  ------------------------------ */
  useEffect(() => {
    const fetchLetters = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get('letters/');

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.letters || response.data.results || [];

        setLetters(data);
      } catch (err) {
        setError('Failed to load letters.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLetters();
  }, []);

  /* ------------------------------
     SET LOCAL OPTIONS (Orgs + Designations)
  ------------------------------ */
  useEffect(() => {
    if (!letters || letters.length === 0) return;

    setLocalLetters(letters);

    const uniqueOrgs = [...new Set(letters.map(l => l.organization?.name))].filter(Boolean);
    const uniqueDesigs = [...new Set(letters.map(l => l.recipient?.designation))].filter(Boolean);

    setOrganizations(uniqueOrgs);
    setDesignations(uniqueDesigs);
  }, [letters]);

  /* ------------------------------
     LOAD CATEGORIES & SIGNATORIES
  ------------------------------ */
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [catRes, sigRes] = await Promise.all([
          axiosInstance.get('letters/categories/'),
          axiosInstance.get('accounts/signatories/')
        ]);

        setCategories(
          Array.isArray(catRes.data) ? catRes.data : catRes.data?.results || []
        );
        setSignatories(
          Array.isArray(sigRes.data) ? sigRes.data : sigRes.data?.results || []
        );
      } catch (err) {
        setCategories([]);
        setSignatories([]);
      }
    };

    fetchDropdownData();
  }, []);

  /* ------------------------------
     FILTER HANDLER
  ------------------------------ */
  const handleSearch = () => {
    const filtered = letters.filter((letter) => {
      if (refNumber && !letter.reference_number?.toLowerCase().includes(refNumber.toLowerCase())) return false;
      if (organization && letter.organization?.name !== organization) return false;
      if (designation && letter.recipient?.designation !== designation) return false;
      if (category && letter.category?.id !== parseInt(category)) return false;
      if (signatory && letter.signatory?.id !== parseInt(signatory)) return false;

      if (fromDate) {
        const letterDate = new Date(letter.created_at);
        if (letterDate < new Date(fromDate)) return false;
      }

      if (toDate) {
        const letterDate = new Date(letter.created_at);
        const max = new Date(toDate);
        max.setHours(23, 59, 59);
        if (letterDate > max) return false;
      }

      if (textContent && !letter.content?.toLowerCase().includes(textContent.toLowerCase())) return false;

      return true;
    });

    setLocalLetters(filtered);
  };

  /* ------------------------------
     RESET FILTERS
  ------------------------------ */
  const handleReset = () => {
    setRefNumber('');
    setOrganization('');
    setDesignation('');
    setCategory('');
    setSignatory('');
    setFromDate('');
    setToDate('');
    setTextContent('');
    setLocalLetters(letters);
  };

  /* ------------------------------
     NAVIGATE TO CREATE FORM
  ------------------------------ */
  const handleAddNew = () => {
    navigate('/letters/create');
  };

  /* ------------------------------
     HANDLE VIEW LETTER FILES
  ------------------------------ */
  const handleViewLetterFiles = (letter) => {
    setSelectedLetterFiles(letter.documents || []);
    setShowFileModal(true);
  };

  const handleViewPage = (letter) => {
    navigate(`/letters/view/${letter.id}`);
  };

  /* ------------------------------
       HANDLE VIEW PDF
    ------------------------------ */
  const handleViewPdf = (letter) => {
    if (letter.documents && letter.documents.length > 0) {
      const latestDoc = letter.documents.sort((a, b) =>
        new Date(b.uploaded_at) - new Date(a.uploaded_at)
      )[0];
      window.open(latestDoc.document, '_blank');
    } else {
      alert("No saved PDF found for this letter reference.");
    }
  };

  /* ------------------------------
     HANDLE DOWNLOAD PDF
  ------------------------------ */
  const handleDownloadPdf = async (letter) => {
    if (!letter.documents || letter.documents.length === 0) {
      alert("No saved PDF found for this letter.");
      return;
    }

    const latestDoc = letter.documents.sort((a, b) =>
      new Date(b.uploaded_at) - new Date(a.uploaded_at)
    )[0];

    try {
      const response = await axiosInstance.get(latestDoc.document, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const safeRef = letter.reference_number ? letter.reference_number.replace(/\//g, '_') : 'letter';
      link.setAttribute('download', `${safeRef}.pdf`);

      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download the file. Please check if the file exists.");
    }
  };


  /* ------------------------------
     CLOSE FILE MODAL
  ------------------------------ */
  const handleCloseFileModal = () => {
    setShowFileModal(false);
    setSelectedLetterFiles([]);
  };

  /* ------------------------------
     LOADING / ERROR STATES
  ------------------------------ */
  if (isLoading) return <div>Loading letters...</div>;
  if (error) return <div>Error loading letters: {error}</div>;

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };


  /* ------------------------------
     RENDER PAGE
  ------------------------------ */
  return (
    <div className="letter-list-container">

      {/* Header Section */}
      <div className="header-section">
        <h1>All Letters</h1>
        <button className="add-new-btn-list" onClick={handleAddNew}>
          <span>+</span> Add New
        </button>
      </div>

      {/* Stats - NOW DYNAMIC */}
      <div className="stats-section">
        <div className="stat-card">
          <span className="stat-label">Sent Today</span>
          <span className="stat-value" style={{ color: '#0096FF' }}>{stats.today}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Sent This Week</span>
          <span className="stat-value" style={{ color: '#FFA500' }}>{stats.week}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Sent This Year</span>
          <span className="stat-value" style={{ color: '#FF3B30' }}>{stats.year}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        {/* ... (Existing filter rows remain exactly the same) ... */}
        {/* Row 1 */}
        <div className="filter-row">
          <div className="filter-group">
            <label>Reference Number</label>
            <input value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
          </div>

          <div className="filter-group">
            <label>Organization</label>
            <select value={organization} onChange={(e) => setOrganization(e.target.value)}>
              <option value="">-- Select --</option>
              {organizations.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Designation</label>
            <select value={designation} onChange={(e) => setDesignation(e.target.value)}>
              <option value="">-- Select --</option>
              {designations.map(des => (
                <option key={des} value={des}>{des}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">-- Select --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="filter-row">
          <div className="filter-group">
            <label>Signatory</label>
            <select value={signatory} onChange={(e) => setSignatory(e.target.value)}>
              <option value="">-- Select --</option>
              {signatories.map(sig => (
                <option key={sig.id} value={sig.id}>
                  {sig.email?.full_name || sig.email?.email}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>From Date</label>
            <DatePicker
              selected={fromDate ? new Date(fromDate) : null}
              onChange={(date) => setFromDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/mm/yyyy"
            />
          </div>

          <div className="filter-group">
            <label>To Date</label>
            <DatePicker
              selected={toDate ? new Date(toDate) : null}
              onChange={(date) => setToDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/mm/yyyy"
            />
          </div>

          <div className="filter-group">
            <label>Text Content </label>
            <input
              type="text"
              placeholder="Coming soon..."
              value=""
              disabled
              style={{
                backgroundColor: "#f1f1f1",
                cursor: "not-allowed",
                color: "#888"
              }}
            />
          </div>
        </div>

        {/* Row 3 - Buttons */}
        <div className="filter-row">
          <div className="filter-group">
            <button className="reset-btn" onClick={handleReset}>
              <i className="fa fa-redo" /> Reset
            </button>

            <button className="search-btn" onClick={handleSearch}>
              <i className="fa fa-search" /> Search
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {localLetters.length === 0 ? (
        <p>No letters found.</p>
      ) : (
        <div className="table-container">
          <table className="letter-table">
            <thead>
              <tr>
                <th>Ref Number</th>
                <th>Organization</th>
                <th>Recipient</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {localLetters.map(letter => (
                <tr key={letter.id}>
                  <td>
                    <span
                      className="ref-link"
                      onClick={() => handleViewPdf(letter)}
                      title="Click to view PDF"
                    >
                      {letter.reference_number}
                    </span>
                  </td>
                  <td>{letter.organization?.name || '---'}</td>
                  <td>
                    {[
                      letter.recipient?.short_designation,
                      letter.recipient?.department
                    ]
                      .filter(Boolean)
                      .join(', ')
                      || '---'}
                  </td>
                  <td>{formatDate(letter.created_at)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn download"
                        onClick={() => handleDownloadPdf(letter)}
                        title="Download PDF"
                      >
                        <img src={downloadIcon} alt="Download" />
                      </button>


                      <button
                        className="action-btn view"
                        onClick={() => handleViewPage(letter)}
                        title="View Letter Details"
                      >
                        <img src={viewIcon} alt="View" />
                      </button>             </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Letter Files Modal */}
      {showFileModal && (
        <div className="modal-overlay" onClick={handleCloseFileModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Letter Files</h2>
              <button className="modal-close-btn" onClick={handleCloseFileModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {selectedLetterFiles.length === 0 ? (
                <p className="no-files-message">No documents uploaded for this letter.</p>
              ) : (
                <div className="file-list">
                  {selectedLetterFiles.map((file) => (
                    <div key={file.id} className="file-item">
                      <div className="file-info">
                        <span className="file-name">Document</span>
                        <span className="file-date">
                          {new Date(file.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="file-actions">
                        <a
                          href={file.document}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-view-btn"
                          title="View in new tab"
                        >
                          <i className="fa fa-eye"></i> View
                        </a>
                        <a
                          href={file.document}
                          download
                          className="file-download-btn"
                          title="Download file"
                        >
                          <i className="fa fa-download"></i> Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LettersPage;