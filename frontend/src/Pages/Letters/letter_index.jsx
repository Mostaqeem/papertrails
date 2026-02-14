import React from 'react';
import { useLetterContext } from '../../context/LetterContext';
import LettersPageComponent from '../../components/Letter/LetterList';
import NewLetterForm from '../../components/Letter/LetterForm';

export function LettersPage() {
  return (
    <div>
      <LettersPageComponent />
    </div>
  );
}


export function LetterForm() {
  return (
    <div>
      <NewLetterForm />
    </div>
  );
}

