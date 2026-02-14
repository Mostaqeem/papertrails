import React from 'react';
import { AgreementProvider } from './AgreementContext';
import { LetterProvider } from './LetterContext';
import { UserProvider } from './UserContext';

export const AppProviders = ({ children }) => {
  return (
    <UserProvider>
      <AgreementProvider>
        <LetterProvider>
          {children}
        </LetterProvider>
      </AgreementProvider>
    </UserProvider>
  );
};