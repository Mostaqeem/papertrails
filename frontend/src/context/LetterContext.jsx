// context/LetterContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const LetterContext = createContext();

// const mockLetters = [
//   {
//     id: 1,
//     reference_number: 'SLUSB/2025/10/001',
//     organization: { name: 'Sonali Bank Ltd.' },
//     recipient: { name: 'Chief Information Technology Officer' },
//     subject: 'System Maintenance Agreement Renewal',
//     created_at: '2025-10-15',
//     status: 'draft'
//   },
//   {
//     id: 2,
//     reference_number: 'SLUSB/2025/10/002',
//     organization: { name: 'Rupali Bank PLC' },
//     recipient: { name: 'Head of IT' },
//     subject: 'Software License Renewal Request',
//     created_at: '2025-10-14',
//     status: 'sent'
//   },
//   {
//     id: 3,
//     reference_number: 'SLUSB/2025/10/003',
//     organization: { name: 'Bangladesh Bank' },
//     recipient: { name: 'Executive Director' },
//     subject: 'Quarterly Progress Report',
//     created_at: '2025-10-13',
//     status: 'draft'
//   },
//   {
//     id: 4,
//     reference_number: 'SLUSB/2025/10/004',
//     organization: { name: 'Agrani Bank' },
//     recipient: { name: 'Managing Director' },
//     subject: 'Partnership Proposal',
//     created_at: '2025-10-12',
//     status: 'sent'
//   }
// ];

export const LetterProvider = ({ children }) => {
  const [letters, setLetters] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock functions to manage letters
  const addLetter = (letter) => {
    const newLetter = {
      ...letter,
      id: letters.length + 1,
      created_at: new Date().toISOString().split('T')[0],
      status: 'draft'
    };
    setLetters([...letters, newLetter]);
    return newLetter;
  };

  const updateLetter = (id, updatedData) => {
    const updatedLetters = letters.map(letter =>
      letter.id === id ? { ...letter, ...updatedData } : letter
    );
    setLetters(updatedLetters);
    return updatedLetters.find(letter => letter.id === id);
  };

  const deleteLetter = (id) => {
    setLetters(letters.filter(letter => letter.id !== id));
  };

  return (
    <LetterContext.Provider value={{
      letters,
      setLetters,
      selectedLetter,
      setSelectedLetter,
      addLetter,
      updateLetter,
      deleteLetter,
      isLoading,
      setIsLoading,
      error,
      setError
    }}>
      {children}
    </LetterContext.Provider>
  );
};

export const useLetterContext = () => {
  const context = useContext(LetterContext);
  if (!context) {
    throw new Error('useLetterContext must be used within a LetterProvider');
  }
  return context;
};

export default LetterContext;