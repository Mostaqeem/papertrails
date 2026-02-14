import LeftPanel from './LeftPanel';
import Header from './Header';
import React, { useState, useEffect } from 'react';
import styles from './MainLayout.module.css';

export const MainLayout = ({ children }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Close panels when clicking on overlay
  const handleOverlayClick = () => {
    setShowSidebar(false);
  };
  
  // Close panels when pressing Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowSidebar(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);
  
  // Prevent body scroll when panels are open on mobile
  useEffect(() => {
    if (showSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSidebar]);

  return (
    <div className={styles['main-layout']}>
      <Header 
        onMenuClick={() => setShowSidebar(v => !v)}
      />
      <LeftPanel 
        show={showSidebar} 
        onClose={() => setShowSidebar(false)} 
      />
      <main className={styles['main-content']}>
        {children}
      </main>
      
      {/* Panel overlay for mobile */}
      <div 
        className={`${styles['panel-overlay']}${showSidebar ? ' ' + styles.active : ''}`}
        onClick={handleOverlayClick}
      />
    </div>
  );
};