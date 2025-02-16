// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import GuessForm from '../components/GuessForm';
import CarbonTreemap from '../components/CarbonTreemap';
import {
  calculateDistance,
  calculateDirection,
  calculateProximity,
} from '../utils/distanceUtils';

// Helper: Haversine formula (distance in km)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Map a bearing (in degrees) to an arrow symbol.
function getDirectionArrow(guessCoords, targetCoords) {
  const dLon = (targetCoords.lon - guessCoords.lon) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(targetCoords.lat * Math.PI / 180);
  const x =
    Math.cos(guessCoords.lat * Math.PI / 180) *
      Math.sin(targetCoords.lat * Math.PI / 180) -
    Math.sin(guessCoords.lat * Math.PI / 180) *
      Math.cos(targetCoords.lat * Math.PI / 180) *
      Math.cos(dLon);
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  if (bearing >= 337.5 || bearing < 22.5) return "↑";
  else if (bearing < 67.5) return "↗";
  else if (bearing < 112.5) return "→";
  else if (bearing < 157.5) return "↘";
  else if (bearing < 202.5) return "↓";
  else if (bearing < 247.5) return "↙";
  else if (bearing < 292.5) return "←";
  else return "↖";
}

// Helper: Given an accuracy fraction (0–1), return a board string of 5 boxes.
function getAccuracyBoard(accuracy) {
  const numBoxes = 5;
  const scaled = accuracy * numBoxes;
  const numGreen = Math.floor(scaled);
  const remainder = scaled - numGreen;
  const numYellow = remainder >= 0.5 ? 1 : 0;
  const numEmpty = numBoxes - numGreen - numYellow;
  return "🟩".repeat(numGreen) + "🟨".repeat(numYellow) + "⬜".repeat(numEmpty);
}

// Helper: Generate a hash from a string (target country) as a hex string.
function generateHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * AnimatedAccuracy Component
 * Animates the accuracy from 0 to finalAccuracy.
 * Displays both an increasing percentage and an animated accuracy board.
 */
function AnimatedAccuracy({ finalAccuracy }) {
  const [displayedAccuracy, setDisplayedAccuracy] = useState(0);

  useEffect(() => {
    const duration = 1500; // total duration in ms
    const steps = 30;
    const intervalTime = duration / steps;
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const newValue = finalAccuracy * (currentStep / steps);
      setDisplayedAccuracy(newValue);
      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, intervalTime);
    return () => clearInterval(interval);
  }, [finalAccuracy]);

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          minWidth: '120px',
          textAlign: 'center'
      }}>
         {`${Math.round(displayedAccuracy * 100)}%`}
      </div>
      <div style={{ fontSize: '1.5rem' }}>
         {getAccuracyBoard(displayedAccuracy)}
      </div>
    </div>
  );
}

function Home() {
  // State declarations.
  const [targetCountry, setTargetCountry] = useState('');
  const [lastGuessedCountry, setLastGuessedCountry] = useState(null);
  // Each guess is now stored as an object: { guess: string, revealed: boolean }
  const [guesses, setGuesses] = useState([]);
  const [uniqueCountries, setUniqueCountries] = useState([]);
  const [showGuessTreemap, setShowGuessTreemap] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [countryCoordinates, setCountryCoordinates] = useState({});
  const [distanceRange, setDistanceRange] = useState({ max: 0 });

  const maxGuesses = 6;
  const hardcodedTargetCountries = ['China', 'United States', 'India', 'Brazil', 'Russia'];

  // Randomize the target country on mount.
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * hardcodedTargetCountries.length);
    setTargetCountry(hardcodedTargetCountries[randomIndex]);
  }, []);

  // Load unique countries from emissions.csv for the dropdown.
  useEffect(() => {
    async function fetchUniqueCountries() {
      try {
        const response = await fetch('/data/emissions.csv');
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: true, dynamicTyping: true });
        const countrySet = new Set();
        results.data.forEach((row) => {
          if (row.Country) {
            countrySet.add(row.Country);
          }
        });
        const countryArray = Array.from(countrySet).sort();
        setUniqueCountries(countryArray);
      } catch (error) {
        console.error('Error fetching unique countries:', error);
      }
    }
    fetchUniqueCountries();
  }, []);

  // Load coordinates from coordinates.csv.
  useEffect(() => {
    async function fetchCoordinates() {
      try {
        const response = await fetch('/data/coordinates.csv');
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: true, dynamicTyping: true });
        const coords = {};
        results.data.forEach((row) => {
          if (row.COUNTRY) {
            // Save using lowercase keys for consistency.
            coords[row.COUNTRY.toLowerCase()] = { lat: Number(row.LATITUDE), lon: Number(row.LONGITUDE) };
          }
        });
        setCountryCoordinates(coords);
      } catch (error) {
        console.error("Error loading coordinates:", error);
      }
    }
    fetchCoordinates();
  }, []);

  // Once targetCountry and coordinates are available, compute the maximum distance.
  useEffect(() => {
    if (targetCountry && Object.keys(countryCoordinates).length > 0) {
      const targetCoords = countryCoordinates[targetCountry.toLowerCase()];
      if (targetCoords) {
        let maxDist = 0;
        for (const key in countryCoordinates) {
          const coords = countryCoordinates[key];
          const d = haversineDistance(targetCoords.lat, targetCoords.lon, coords.lat, coords.lon);
          if (d > maxDist) maxDist = d;
        }
        setDistanceRange({ max: maxDist });
      }
    }
  }, [targetCountry, countryCoordinates]);

  // Helper: Compute metrics for a given guess.
  function computeMetrics(guessCountry) {
    const targetCoords = countryCoordinates[targetCountry.toLowerCase()];
    const guessCoords = countryCoordinates[guessCountry.toLowerCase()];
    if (!targetCoords || !guessCoords || distanceRange.max === 0) return null;
    const distance = haversineDistance(targetCoords.lat, targetCoords.lon, guessCoords.lat, guessCoords.lon);
    const accuracy = (distanceRange.max - distance) / distanceRange.max; // 1 is best, 0 is worst.
    const arrow = getDirectionArrow(guessCoords, targetCoords);
    const board = getAccuracyBoard(accuracy);
    return { distance, accuracy, arrow, board };
  }

  // Handler for when a guess is submitted.
  const handleGuess = (guess) => {
    const newGuessObj = { guess, revealed: false };
    const newGuesses = [...guesses, newGuessObj];
    setGuesses(newGuesses);
    setLastGuessedCountry(guess);

    if (guess.toLowerCase() === targetCountry.toLowerCase()) {
      setModalType("win");
      setShowModal(true);
    } else if (newGuesses.length === maxGuesses) {
      setModalType("lose");
      setShowModal(true);
    }
    // After animation duration, mark this guess as revealed.
    setTimeout(() => {
      setGuesses(prev => {
         const updated = [...prev];
         updated[updated.length - 1] = { ...updated[updated.length - 1], revealed: true };
         return updated;
      });
    }, 1500);
  };

  // Build the game board (one row per guess) for the modal.
  const gameBoard = guesses
    .map((guessObj) => {
      const metrics = computeMetrics(guessObj.guess);
      return metrics ? metrics.board : "-----";
    })
    .join("\n");

  // Reset game handler.
  const resetGame = () => {
    const randomIndex = Math.floor(Math.random() * hardcodedTargetCountries.length);
    setTargetCountry(hardcodedTargetCountries[randomIndex]);
    setGuesses([]);
    setLastGuessedCountry(null);
    setShowModal(false);
    setModalType("");
    setShowGuessTreemap(true);
  };

  // Custom modal component for game results.
  function GameResultModal({ modalType, gameBoard, onReset }) {
    const gameName = "Carble";
    const puzzleNumber = "Puzzle #1077";
    const title = modalType === "win" ? "Congratulations!" : "Try again next time!";
    
    // Build share text in the requested format.
    const hash = generateHash(targetCountry);
    const shareText = `#Cardle #${hash} ${guesses.length}/${maxGuesses}\n${gameBoard}\nhttps://cardle.net/`;

    const handleShare = () => {
      navigator.clipboard.writeText(shareText)
        .then(() => alert("Results copied to clipboard!"))
        .catch(() => alert("Failed to copy results."));
    };

    return (
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "2rem",
            textAlign: "center",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          }}
        >
          <h2>{title}</h2>
          <h3>{gameName}</h3>
          <p>{puzzleNumber}</p>
          <pre style={{ fontSize: "1.5rem", textAlign: "center", lineHeight: "1.3" }}>
            {gameBoard}
          </pre>
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-around" }}>
            <button
              onClick={handleShare}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "4px",
                backgroundColor: "#8884d8",
                color: "white",
                cursor: "pointer",
              }}
            >
              Share
            </button>
            <button
              onClick={onReset}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "4px",
                backgroundColor: "#8884d8",
                color: "white",
                cursor: "pointer",
              }}
            >
              New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render a guess list item as an inline row.
  // If the guess is not yet revealed, render the AnimatedAccuracy component.
  function renderGuessItem(guessObj, index) {
    const guess = guessObj.guess;
    const metrics = computeMetrics(guess);
    const isCorrect = guess.toLowerCase() === targetCountry.toLowerCase();
    if (!guessObj.revealed) {
      return (
        <li
          key={index}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '0.75rem',
            padding: '0.5rem',
            borderRadius: '8px',
            backgroundColor: 'transparent',
          }}
        >
          <AnimatedAccuracy finalAccuracy={metrics ? metrics.accuracy : 0} />
        </li>
      );
    }
    return (
      <li
        key={index}
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '0.75rem',
          padding: '0.5rem',
          borderRadius: '8px',
          backgroundColor: isCorrect ? 'lightgoldenrodyellow' : 'transparent',
        }}
      >
        <div style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          minWidth: '100px',
          textAlign: 'center'
        }}>
          {guess}
        </div>
        <div style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          minWidth: '80px',
          textAlign: 'center'
        }}>
          {metrics ? `${metrics.distance.toFixed(0)} km` : 'N/A'}
        </div>
        <div style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          minWidth: '50px',
          textAlign: 'center'
        }}>
          {metrics ? metrics.arrow : 'N/A'}
        </div>
        <div style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          minWidth: '120px',
          textAlign: 'center'
        }}>
          {metrics ? `${Math.round(metrics.accuracy * 100)}%` : 'N/A'}
        </div>
      </li>
    );
  }

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <h1>Carbon TRADLE - Home</h1>

      {/* Target country treemap (country name hidden) */}
      <div>
        <h2>Target Country Treemap</h2>
        {targetCountry ? (
          <CarbonTreemap targetCountry={targetCountry} hideCountryName={true} />
        ) : (
          <p>Loading target country...</p>
        )}
      </div>

      {/* Guess list – centered with inline styled boxes */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <h3>Your Guesses</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto', width: 'fit-content' }}>
          {Array.from({ length: maxGuesses }).map((_, index) =>
            guesses[index] ? renderGuessItem(guesses[index], index) : (
              <li
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '0.75rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                }}
              >
                <div style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  minWidth: '100px',
                  textAlign: 'center'
                }}>
                  {`Guess ${index + 1}`}
                </div>
                <div style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  minWidth: '80px',
                  textAlign: 'center'
                }}>
                  ---
                </div>
                <div style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  minWidth: '50px',
                  textAlign: 'center'
                }}>
                  ---
                </div>
                <div style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  minWidth: '120px',
                  textAlign: 'center'
                }}>
                  ---
                </div>
              </li>
            )
          )}
        </ul>
      </div>

      {/* Most recent guess treemap with toggle */}
      <div style={{ marginTop: '2rem' }}>
        <h2>
          {lastGuessedCountry
            ? `Your Guess Treemap (${lastGuessedCountry})`
            : 'Your Guess Treemap (No guess yet)'}
        </h2>
        {lastGuessedCountry && (
          <button onClick={() => setShowGuessTreemap(prev => !prev)}>
            {showGuessTreemap ? 'Hide' : 'Show'} Guess Treemap
          </button>
        )}
        {lastGuessedCountry ? (
          showGuessTreemap ? (
            <CarbonTreemap targetCountry={lastGuessedCountry} />
          ) : (
            <p>Guess treemap hidden.</p>
          )
        ) : (
          <p>Please enter a guess to see the treemap for that country.</p>
        )}
      </div>

      {/* Guess form using dropdown populated by unique countries */}
      <div style={{ marginTop: '2rem' }}>
        {guesses.length < maxGuesses ? (
          <GuessForm onGuess={handleGuess} uniqueCountries={uniqueCountries} />
        ) : (
          <p>No more guesses allowed.</p>
        )}
      </div>

      {/* Custom modal for game result */}
      {showModal && (
        <GameResultModal
          modalType={modalType}
          gameBoard={gameBoard}
          onReset={resetGame}
        />
      )}
    </div>
  );
}

export default Home;
