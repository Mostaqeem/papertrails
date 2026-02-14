import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgreementContext } from '../../context/AgreementContext';
import { FiPlus } from 'react-icons/fi';
import axiosInstance from '../../axiosConfig';
import SearchBar from '../SearchBar';
import StatusBadge from '../Common/StatusBadge';
import { getUserData } from '../../utils/userUtils';
import './AgreementList.css';
import viewicon from '../../assets/icons/view.svg';
import editicon from '../../assets/icons/edit.svg';

export default function AgreementList({ agreements: propAgreements }) {
  const { startEditing, deleteAgreement, prepareNewAgreement } = useAgreementContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [agreements, setAgreements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isExecutive, setIsExecutive] = useState(false);
  const [isShowingSearchResults, setIsShowingSearchResults] = useState(false);

  const handleCreate = async () => {
    if (isExecutive) {
      alert('Executive users cannot create agreements. You can only view existing agreements.');
      return;
    }
    prepareNewAgreement();
    navigate('/agreements/create');
  };

  const handleEdit = async (agreement) => {
    if (isExecutive) {
      alert('Executive users cannot edit agreements. You can only view existing agreements.');
      return;
    }
    startEditing(agreement);
    navigate(`/agreements/edit/${agreement.id || agreement.agreementId}`);
  };

  const handleView = (agreement) => {
    startEditing(agreement);
    navigate(`/agreements/preview/${agreement.id || agreement.agreementId}`);
  };

  const handleClearSearch = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('agreements/');
      const agreementsData = Array.isArray(response.data)
        ? response.data
        : (response.data.agreements || response.data.results || []);
      setAgreements(agreementsData);
      setIsShowingSearchResults(false);
    } catch (error) {
      console.error('Error fetching agreements:', error);
      setError('Failed to load agreements.\n Your are not authorized.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAgreements = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('agreements/');
        // console.log('Fetched agreements:', response.data);
        // console.log('Current user data:', getUserData());

        const agreementsData = Array.isArray(response.data)
          ? response.data
          : (response.data.agreements || response.data.results || []);
        setAgreements(agreementsData);

        if (response.data.departments) {
          setDepartments(response.data.departments);
        }
      } catch (error) {
        console.error('Error fetching agreements:', error);
        setError('Failed to load agreements. ABCDEF');
      } finally {
        setLoading(false);
      }
    };
    fetchAgreements();
  }, []);

  useEffect(() => {
    const checkUserPermissions = async () => {
      try {
        await axiosInstance.get('agreements/form-data/');
        setIsExecutive(false);
      } catch (error) {
        if (error.response?.status === 403) {
          setIsExecutive(true);
        } else {
          setIsExecutive(false);
        }
      }
    };
    checkUserPermissions();
  }, []);

  if (loading) {
    return (
      <div className="agreement-list-empty">
        <div>Loading agreements...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agreement-list-empty">
        <div>{error}</div>
        <button onClick={() => window.location.reload()} className="agreement-list-empty-btn agreement-list-empty-btn-secondary">
          Retry
        </button>
      </div>
    );
  }
  return (
    <div className="agreement-list">
      <div className="agreement-list-header">
        <h2 className="agreement-list-title">{isExecutive ? 'All Agreements' : 'My Agreements'}</h2>
        {!isExecutive && (
          <button onClick={handleCreate} className="agreement-list-create-btn">
            <FiPlus size={16} />
            <span>Add New Agreement</span>
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="agreement-list-search-container">
        <SearchBar
          onSearchResults={(results) => {
            console.log('Search Results received:', results);
            setAgreements(results);
            setIsShowingSearchResults(true);
            setIsSearching(false);
          }}
          onSearchError={(error) => {
            console.log('Search Error:', error);
            setError(error);
            setIsSearching(false);
          }}
          isLoading={loading}
          isSearching={isSearching}
        />
      </div>

      {/* Search results indicator */}
      {isShowingSearchResults && (
        <div className="agreement-list-search-results">
          <span>Showing search results ({agreements.length} agreements found)</span>
          <button
            onClick={handleClearSearch}
            className="agreement-list-clear-search"
          >
            Clear Search
          </button>
        </div>
      )}

      {agreements.length === 0 ? (
        <div className="agreement-list-empty">
          <div>
            {isShowingSearchResults ? 'No agreements match your search criteria.' : 'No agreements found.'}
          </div>
          {!isExecutive && !isShowingSearchResults && (
            <button onClick={handleCreate} className="agreement-list-empty-btn">
              Create Your First Agreement
            </button>
          )}
          {isShowingSearchResults && (
            <button onClick={handleClearSearch} className="agreement-list-empty-btn agreement-list-empty-btn-secondary">
              Show All Agreements
            </button>
          )}
        </div>
      ) : (
        <>
          <table className="agreement-list-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Agreement Type</th>
                <th>Party</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(agreements) ? agreements : []).map((agreement, index) => (
                <tr key={index}>
                  <td>{agreement.title || agreement.agreementTitle}</td>
                  <td>{agreement.agreement_type_name || agreement.agreement_type?.name || agreement.agreement_type}</td>
                  <td>{agreement.party_name_display || agreement.party_name?.name || agreement.party_name || agreement.type || agreement.party}</td>
                  <td><StatusBadge status={agreement.status} /></td>
                  <td>{agreement.start_date || agreement.startDate}</td>
                  <td>{agreement.expiry_date || agreement.expiryDate}</td>
                  <td>
                    <div className="agreement-list-actions">
                      <button onClick={() => handleView(agreement)} className="agreement-list-action-btn agreement-list-view-btn">
                        {/* Custom checkmark icon for View */}
                        <img src={viewicon} alt="View" />
                      </button>
                      {!isExecutive && (
                        <>
                          {console.log('Agreement:', agreement)}
                          {console.log('User data:', getUserData())}
                          <button
                            onClick={() => handleEdit(agreement)}
                            className="agreement-list-action-btn agreement-list-edit-btn"
                            style={{
                              display: (
                                // Show edit button if user belongs to the agreement's department
                                (getUserData()?.department?.id === (agreement.department?.id || agreement.department)) ||
                                // OR if user has permission for this department
                                (getUserData()?.permitted_departments || []).some(
                                  dept => dept.id === (agreement.department?.id || agreement.department)
                                )
                              ) ? 'inline-flex' : 'none'
                            }}
                          >
                            {/* Custom checkmark icon for Edit */}
                            <img src={editicon} alt="Edit" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
