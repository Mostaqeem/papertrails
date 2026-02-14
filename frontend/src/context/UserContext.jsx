import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (err) {
      setError('Failed to load user data');
      console.error('UserContext initialization error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user in context and localStorage
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  // Logout - clear user data
  const logout = () => {
    setUser(null);
    localStorage.removeItem('userData');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userDepartment');
    localStorage.removeItem('userDepartmentId');
    localStorage.removeItem('userIsExecutive');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
  };

  const value = {
    user,
    setUser: updateUser,
    logout,
    loading,
    error,
    isLoggedIn: !!user,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
