import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosConfig';
import styles from './ProtectedAgreementRoute.module.css';

export function ProtectedAgreementRoute({ children, restrictedForExecutives = false }) {
  const [isExecutive, setIsExecutive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserPermissions = async () => {
      try {
        await axiosInstance.get('agreements/form-data/');
        setIsExecutive(false);
      } catch (error) {
        setIsExecutive(error.response?.status === 403);
      } finally {
        setLoading(false);
      }
    };
    checkUserPermissions();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (restrictedForExecutives && isExecutive) {
    return (
      <div className={styles.accessDenied}>
        <h2>Access Denied</h2>
        <p>Executive users cannot access this page. You can only view existing agreements.</p>
        <button 
          onClick={() => window.history.back()} 
          className={styles.backButton}
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
}