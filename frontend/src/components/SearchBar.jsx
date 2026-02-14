
import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import './SearchBar.css';

export default function SearchBar({ onSearchResults, onSearchError, isLoading = false }) {
  const [filters, setFilters] = useState({
    partyName: '',
    agreementType: '',
    status: ''
  });
  
  const [options, setOptions] = useState({
    partyNames: [],
    agreementTypes: [],
    statusOptions: []
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [connectionError, setConnectionError] = useState('');

  // Fetch filter options from Django backend
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setIsLoadingOptions(true);
        setConnectionError('');
        
        const response = await axiosInstance.get('/agreements/search-options/');
        console.log('Options data received:', response.data.agreement_types[0]);


        
        console.log('Filter options from backend:', response.data);
        
        // Convert arrays of strings to arrays of objects with value and label
        const formatOptions = (items) => items.map(item => ({ value: item, label: item }));
        
        setOptions({
          partyNames: formatOptions(response.data.vendors || []),
          agreementTypes: formatOptions(response.data.agreement_types || []),
          statusOptions: formatOptions(response.data.statuses || [])
        });
        
        console.log('Formatted filter options:', {
          partyNames: options.partyNames,
          agreementTypes: options.agreementTypes,
          statusOptions: options.statusOptions
        });
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
        setConnectionError(`Connection failed: ${error.message}`);
        if (onSearchError) {
          onSearchError('Failed to load filter options');
        }
      } finally {
        setIsLoadingOptions(false);
      }
    };

    // console.log('Fetching filter options...', options.partyNames, options.agreementTypes, options.statusOptions);

    fetchFilterOptions();
  }, [onSearchError]);

  // Handle individual filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();

    if (filters.partyName) params.append('party_name', filters.partyName);
    if (filters.agreementType) params.append('agreement_type', filters.agreementType);
    if (filters.status) params.append('status', filters.status);

    console.log('Query parameters:', params.toString());
    return params.toString();
  };

  // Handle search submission with fetch
  const handleSearch = async () => {
    setIsSearching(true);
    setConnectionError('');

    try {
      const queryParams = buildQueryParams();
      const response = await axiosInstance.get(`/agreements/search/?${queryParams}`);
      console.log('API Response:', response);
      console.log('API Response Data:', response.data);

      // Direct access to response.data if it's an array, otherwise try to find the array in the response
      let agreementsArray;
      if (Array.isArray(response.data)) {
        agreementsArray = response.data;
      } else if (response.data.agreements) {
        agreementsArray = response.data.agreements;
      } else if (response.data.results) {
        agreementsArray = response.data.results;
      } else {
        agreementsArray = [];
      }

      console.log('Final Agreements Array:', agreementsArray);
      
      if (onSearchResults) {
        onSearchResults(agreementsArray);
      }

    } catch (error) {
      console.error('Search error:', error);
      setConnectionError(`Search failed: ${error.message}`);
      if (onSearchError) {
        onSearchError(error.message || 'Failed to fetch search results');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Clear all filters
  const handleClear = () => {
    setFilters({
      partyName: '',
      agreementType: '',
      status: ''
    });
    
    if (onSearchResults) {
      onSearchResults([]);
    }
  };

  // Check if any filter is active
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="search-container">
      {/* Connection error display */}
      {connectionError && (
        <div className="connection-error">
          <strong>Connection Issue:</strong> {connectionError}
        </div>
      )}

      {/* Party Name Dropdown */}
      <div className="search-input-group">
        <label htmlFor="party-name" className="search-label">
          Party Name
        </label>
        <select
          id="party-name"
          value={filters.partyName}
          onChange={(e) => handleFilterChange('partyName', e.target.value)}
          className="search-select"
          disabled={isLoading || isSearching || isLoadingOptions}
        >
          <option value="">Select</option>
          {options.partyNames.map(party => (
            <option key={party.value} value={party.value}>
              {party.label}
            </option>
          ))}
        </select>
      </div>

      {/* Agreement Type Dropdown */}
      <div className="search-input-group">
        <label htmlFor="agreement-type" className="search-label">
          Agreement Type
        </label>
        <select
          id="agreement-type"
          value={filters.agreementType}
          onChange={(e) => handleFilterChange('agreementType', e.target.value)}
          className="search-select"
          disabled={isLoading || isSearching || isLoadingOptions}
        >
          <option value="">Select</option>
          {options.agreementTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status Dropdown */}
      <div className="search-input-group">
        <label htmlFor="status" className="search-label">
          Status
        </label>
        <select
          id="status"
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="search-select"
          disabled={isLoading || isSearching || isLoadingOptions}
        >
          <option value="">Select</option>
          {options.statusOptions.map(status => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="search-actions">
        <button 
          className="search-button"
          onClick={handleSearch}
          disabled={isLoading || isSearching || isLoadingOptions}
        >
          {isSearching ? (
            <span className="search-loading">Searching...</span>
          ) : (
            <>
              <svg
                className="search-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              Search
            </>
          )}
        </button>
      </div>
      
      {isLoadingOptions && (
        <div className="loading-options">
          Loading filter options...
        </div>
      )}
    </div>
  );
}

// Helper function to get CSRF token
function getCSRFToken() {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
  
  return cookieValue || '';
}

