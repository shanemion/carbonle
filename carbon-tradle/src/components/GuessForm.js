// src/components/GuessForm.js
import React, { useState } from 'react';

function GuessForm({ onGuess, uniqueCountries }) {
  const [guess, setGuess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (guess) {
      onGuess(guess);
      setGuess('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="countryGuess">Guess the Country:</label>
      <select
        id="countryGuess"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        style={{ marginLeft: '0.5rem' }}
      >
        <option value="" disabled>
          Select a country...
        </option>
        {uniqueCountries.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
      <button type="submit" disabled={!guess} style={{ marginLeft: '1rem' }}>
        Guess
      </button>
    </form>
  );
}

export default GuessForm;
