import React, { useState, useEffect } from 'react';
import AgreementPreview from '../../components/Agreement/AgreementPreview';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../axiosConfig';

export default function PreviewAgreement() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vendors, setVendors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [agreementTypes, setAgreementTypes] = useState([]);
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch vendors, departments, and agreement types on mount
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await axiosInstance.get('accounts/vendors/');
        setVendors(response.data);
      } catch (error) {
        setVendors([]);
      }
    };
    const fetchDepartments = async () => {
      try {
        const response = await axiosInstance.get('agreements/form-data/');
        setDepartments(response.data.departments || []);
      } catch (error) {
        setDepartments([]);
      }
    };
    const fetchAgreementTypes = async () => {
      try {
        const response = await axiosInstance.get('agreements/agreement-types/');
        setAgreementTypes(response.data.results || response.data || []);
      } catch (error) {
        setAgreementTypes([]);
      }
    };
    fetchVendors();
    fetchDepartments();
    fetchAgreementTypes();
  }, []);

  // Always fetch agreement by ID if id param is present
  useEffect(() => {
    if (id) {
      setLoading(true);
      axiosInstance.get(`agreements/${id}/`)
        .then(response => {
          setAgreement(response.data);
          setError(null);
        })
        .catch(err => {
          setError('Failed to load agreement. You are not authorized. \n ' );
          setAgreement(null);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSave = () => {
    navigate('/agreements');
  };
  
  const handleEdit = () => {
    if (agreement) {
      navigate(`/agreements/edit/${agreement.id || agreement.agreementId}`);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading agreement...</div>;
  }
  if (error) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}><h1>{error}</h1></div>;
  }
  if (!agreement) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>No agreement found.</div>;
  }

  return <AgreementPreview 
    data={agreement} 
    vendors={vendors}
    departments={departments}
    agreementTypes={agreementTypes}
    onSave={handleSave} 
    onEdit={handleEdit} 
    viewMode={true} 
    onTestReminder={() => {}} // Add empty function for now
    isTestingReminder={false} // Add false for now
  />;
} 