// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import GuessForm from '../components/GuessForm';
import CarbonTreemap from '../components/CarbonTreemap';
import CarbonNestedTreemapD3 from '../components/CarbonTreemapD3';
import {
  haversineDistance,
  getDirectionArrow,
  getAccuracyBoard,
  generateHash,
} from '../utils/distanceUtils';
import CarbonTreemapNest from '../components/CarbonTreemapNest';
import OpenAIChat from '../components/openai';
import map from '../assets/worldMap.png';


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
    <div
      style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          minWidth: '120px',
          textAlign: 'center',
        }}
      >
        {Math.round(displayedAccuracy * 100)}%
      </div>
      <div style={{ fontSize: '1.5rem' }}>
        {getAccuracyBoard(displayedAccuracy)}
      </div>
    </div>
  );
}

function Home() {
  // State declarations
  const [targetCountry, setTargetCountry] = useState('');
  const [lastGuessedCountry, setLastGuessedCountry] = useState(null);
  // Each guess is now stored as an object: { guess: string, revealed: boolean }
  const [guesses, setGuesses] = useState([]);
  const [uniqueCountries, setUniqueCountries] = useState([]);
  const [showGuessTreemap, setShowGuessTreemap] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [countryCoordinates, setCountryCoordinates] = useState({});
  const [distanceRange, setDistanceRange] = useState({ max: 0 });
  const [showAIChatModal, setShowAIChatModal] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [showHowToUseModal, setShowHowToUseModal] = useState(false);



  const maxGuesses = 6;
  let hardcodedTargetCountries = [
    "Afghanistan", "Angola", "Albania", "Andorra", "Argentina", "Armenia", "Antigua and Barbuda",
    "Australia", "Austria", "Azerbaijan", "Burundi", "Belgium", "Benin", "Burkina Faso", "Bangladesh",
    "Bulgaria", "Bahrain", "Bahamas", "Bosnia and Herzegovina", "Belarus", "Belize", "Bolivia", "Brazil",
    "Barbados", "Brunei", "Bhutan", "Botswana", "Central African Republic", "Canada", "Chile", "China",
    "Ivory Coast", "Cameroon", "Democratic Republic of the Congo", "Colombia", "Comoros",
    "Cape Verde", "Costa Rica", "Cuba", "Cyprus", "Czech Republic", "Djibouti", "Dominica", "Denmark",
    "Dominican Republic", "Algeria", "Croatia", "Cambodia", "Chad", "Germany", "Ecuador", "Egypt", "Eritrea",
    "Estonia", "Ethiopia", "Finland", "Fiji", "France", "Gabon", "Georgia", "Ghana", "Guinea", "Gambia",
    "Guinea-Bissau", "Equatorial Guinea", "Greece", "Grenada", "Guatemala", "Guyana", "Honduras", "Haiti",
    "Hungary", "Indonesia", "India", "Ireland", "Iran", "Iraq", "Iceland", "Israel", "Italy", "Jamaica",
    "Jordan", "Japan", "Kazakhstan", "Kenya", "Kyrgyzstan", "Kiribati", "Kuwait", "Laos", "Lebanon",
    "Liberia", "Libya", "Liechtenstein", "Lesotho", "Lithuania", "Luxembourg", "Latvia", "El Salvador",
    "Eswatini", "Republic of the Congo", "Micronesia", "Saint Kitts and Nevis", "Saint Lucia", "Morocco",
    "Moldova", "Madagascar", "Maldives", "Mexico", "North Macedonia", "Mali", "Malta",
    "Myanmar", "Montenegro", "Mongolia", "Mozambique", "Mauritania", "Mauritius", "Malawi", "Malaysia",
    "Namibia", "Niger", "Nigeria", "Nicaragua", "Niue", "Netherlands", "Norway", "Nepal", "Nauru", "New Zealand",
    "Oman", "Pakistan", "Panama", "Peru", "Philippines", "Palau", "Papua New Guinea", "Poland", "North Korea",
    "Portugal", "Paraguay", "Qatar", "Romania", "Russia", "Rwanda", "Saudi Arabia", "São Tomé and Príncipe",
    "Saint Vincent and the Grenadines", "Samoa", "United Arab Emirates", "Switzerland", "Spain",
    "United Kingdom", "South Korea", "Sri Lanka", "Sudan", "Senegal", "Singapore", "Solomon Islands",
    "Sierra Leone", "Somalia", "Serbia", "South Sudan", "Suriname", "Slovakia", "Slovenia", "Sweden",
    "Seychelles", "Syria", "Togo", "Thailand", "Tajikistan", "Turkmenistan", "Timor-Leste", "Tonga",
    "Trinidad and Tobago", "Tunisia", "Turkey", "Tuvalu", "Tanzania", "Uganda", "Ukraine", "Uruguay",
    "United States", "Uzbekistan", "Venezuela", "Vietnam", "Vanuatu", "Yemen", "South Africa", "Zambia", "Zimbabwe"
  ];


  // Randomize the target country on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * hardcodedTargetCountries.length);
    setTargetCountry(hardcodedTargetCountries[randomIndex]);
  }, []);

  // ======== "How To Use" Modal ========
  function HowToUseModal({ onClose }) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            textAlign: 'left',
          }}
        >
          <h2 style={{ marginTop: 0 }}>How to Use This Application</h2>
          <p>
            <strong>Purpose:</strong> This is a geography and environmental puzzle game where you 
            have up to 6 guesses to identify the target country. The application leverages 
            real-world carbon emissions data and displays them with Recharts Treemaps. 
          </p>
          <p>
            <strong>How It Works:</strong> 
          </p>
          <ul>
            <li>
              A random <em>target country</em> is chosen at the start.
            </li>
            <li>
              Enter your guesses in the input field. Each guess reveals hints about distance
              and accuracy, guiding you closer to the target.
            </li>
            <li>
              Treemaps are displayed for both the target country (showing sector-based emissions)
              and your most recent guess (to compare sector emissions).
            </li>
            <li>
              If you run out of guesses or guess the country correctly, a final result screen appears.
            </li>
            <li>
              After the game ends, an OpenAI-based summary is displayed with environmental information
              about the target country.
            </li>
          </ul>
          <p>
            <strong>Features:</strong>
          </p>
          <ul>
            <li>
              <em>Distance &amp; Accuracy Feedback:</em> We use haversine distance to compute how far 
              your guess is from the target. This is converted to a visual accuracy meter.
            </li>
            <li>
              <em>Sector Emissions Data:</em> Sectors like Energy, Industrial, Agriculture, etc., 
              are shown in Treemaps for a deeper look at each country’s emission sources.
            </li>
            <li>
              <em>OpenAI Chat:</em> After the puzzle, you get an AI-generated summary of 
              environmental insights for the revealed country.
            </li>
          </ul>
          <p>
            Explore the <em>World Map</em> to get a general sense of geography (click the "Show World Map" button).
            Then, apply your knowledge to guess the country as efficiently as possible!
          </p>
          <button
            onClick={onClose}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#8884d8',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }


  // Load unique countries from emissions.csv for the dropdown
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

  // Load coordinates from coordinates.csv
  useEffect(() => {
    async function fetchCoordinates() {
      try {
        const response = await fetch('/data/coordinates.csv');
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: true, dynamicTyping: true });
        const coords = {};

        results.data.forEach((row) => {
          if (row.COUNTRY) {
            // Save using lowercase keys for consistency
            coords[row.COUNTRY.toLowerCase()] = {
              lat: Number(row.LATITUDE),
              lon: Number(row.LONGITUDE),
            };
          }
        });

        setCountryCoordinates(coords);
      } catch (error) {
        console.error('Error loading coordinates:', error);
      }
    }
    fetchCoordinates();
  }, []);

  // Once targetCountry and coordinates are available, compute the maximum distance
  useEffect(() => {
    if (targetCountry && Object.keys(countryCoordinates).length > 0) {
      const targetCoords = countryCoordinates[targetCountry.toLowerCase()];
      if (targetCoords) {
        let maxDist = 0;
        for (const key in countryCoordinates) {
          const coords = countryCoordinates[key];
          const d = haversineDistance(
            targetCoords.lat,
            targetCoords.lon,
            coords.lat,
            coords.lon
          );
          if (d > maxDist) maxDist = d;
        }
        setDistanceRange({ max: maxDist });
      }
    }
  }, [targetCountry, countryCoordinates]);

  // Helper: Compute metrics for a given guess
  function computeMetrics(guessCountry) {
    const targetCoords = countryCoordinates[targetCountry.toLowerCase()];
    const guessCoords = countryCoordinates[guessCountry.toLowerCase()];
    if (!targetCoords || !guessCoords || distanceRange.max === 0) return null;

    const distance = haversineDistance(
      targetCoords.lat,
      targetCoords.lon,
      guessCoords.lat,
      guessCoords.lon
    );
    const accuracy = (distanceRange.max - distance) / distanceRange.max; // 1 is best, 0 is worst
    const arrow = getDirectionArrow(guessCoords, targetCoords);
    const board = getAccuracyBoard(accuracy);

    return { distance, accuracy, arrow, board };
  }

  // Handler for when a guess is submitted
  const handleGuess = (guess) => {
    const newGuessObj = { guess, revealed: false };
    const newGuesses = [...guesses, newGuessObj];
    setGuesses(newGuesses);
    setLastGuessedCountry(guess);

    if (guess.toLowerCase() === targetCountry.toLowerCase()) {
      setModalType('win');
      setShowModal(true);
      setShowAIChatModal(true);   // Also show the AI Chat modal

    } else if (newGuesses.length === maxGuesses) {
      setModalType('lose');
      setShowModal(true);
      setShowAIChatModal(true);   // Also show the AI Chat modal

    }

    // After animation duration, mark this guess as revealed
    setTimeout(() => {
      setGuesses((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          revealed: true,
        };
        return updated;
      });
    }, 1500);
  };

  // Build the game board (one row per guess) for the modal
  const gameBoard = guesses
    .map((guessObj) => {
      const metrics = computeMetrics(guessObj.guess);
      return metrics ? metrics.board : '-----';
    })
    .join('\n');

  // Reset game handler
  const resetGame = () => {
    const randomIndex = Math.floor(Math.random() * hardcodedTargetCountries.length);
    setTargetCountry(hardcodedTargetCountries[randomIndex]);
    setGuesses([]);
    setLastGuessedCountry(null);
    setShowModal(false);
    setModalType('');
    setShowGuessTreemap(true);
  };

  const WorldMapModal = ({ showWorldMap = true, setShowWorldMap = () => {} }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white w-[95vw] h-[90vh] rounded-lg p-8 flex flex-col relative">
          {/* Map container with flex-grow to take available space */}
          <div className="flex-grow flex items-center justify-center overflow-hidden">
            <img 
              src={map}
              alt="World Map" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
          
          {/* Footer with close button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowWorldMap(false)}
              className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
            

  // Custom modal component for game results
  function GameResultModal({ modalType, gameBoard, onReset }) {
    const gameName = 'CarbonLE';
    const puzzleNumber = 'Puzzle #1077';
    const title = modalType === 'win' ? 'Congratulations!' : 'Try again next time!';
    const hash = generateHash(targetCountry);

    // Build share text in the requested format
    const shareText = `#Cardle #${hash} ${guesses.length}/${maxGuesses}\n${gameBoard}\nhttps://cardle.net/`;

    const handleShare = () => {
      navigator.clipboard
        .writeText(shareText)
        .then(() => alert('Results copied to clipboard!'))
        .catch(() => alert('Failed to copy results.'));
    };

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          }}
        >
          <h2>{title}</h2>
          <h3>{gameName}</h3>
          <p>{puzzleNumber}</p>
          <pre
            style={{
              fontSize: '1.5rem',
              textAlign: 'center',
              lineHeight: '1.3',
            }}
          >
            {gameBoard}
          </pre>

          <div
            style={{
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            <button
              onClick={handleShare}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#8884d8',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Share
            </button>
            <button
              onClick={onReset}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#8884d8',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              New Game
            </button>
          </div>
          <OpenAIChat targetCountry={targetCountry} showModal={showModal} />

        </div>
      </div>
    );
  }

  // Render a guess list item as an inline row
  // If the guess is not yet revealed, render the AnimatedAccuracy component
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
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            minWidth: '100px',
            textAlign: 'center',
          }}
        >
          {guess}
        </div>
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            minWidth: '80px',
            textAlign: 'center',
          }}
        >
          {metrics ? `${metrics.distance.toFixed(0)} km` : 'N/A'}
        </div>
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            minWidth: '50px',
            textAlign: 'center',
          }}
        >
          {metrics ? metrics.arrow : 'N/A'}
        </div>
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            minWidth: '120px',
            textAlign: 'center',
          }}
        >
          {metrics ? `${Math.round(metrics.accuracy * 100)}%` : 'N/A'}
        </div>
      </li>
    );
  }

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button
          onClick={() => setShowHowToUseModal(true)}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#8884d8',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          How to Use
        </button>
      </div>

       {/* Show "How to Use" modal if open */}
       {showHowToUseModal && <HowToUseModal onClose={() => setShowHowToUseModal(false)} />}

      
      <div>
        {/* <h2>Target Country Treemap</h2> */}
        {targetCountry ? (
         <CarbonTreemap targetCountry={targetCountry} />

        ) : (
          <p>Loading target country...</p>
        )}
      </div>

      
      <div>
        {/* <h2>Target Country Treemap</h2> */}
        {targetCountry ? (
         <CarbonTreemapNest targetCountry={targetCountry} />

        ) : (
          <p>Loading target country...</p>
        )}
      </div>

      {/* Target country treemap (country name hidden) */}
      <div>
        {/* <h2>D3</h2>
        {targetCountry ? (
         <CarbonNestedTreemapD3 targetCountry="China" />

        ) : (
          <p>Loading target country...</p>
        )} */}
      </div>

      {/* Guess list – centered with inline styled boxes */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <h3>Your Guesses</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto', width: 'fit-content' }}>
          {Array.from({ length: maxGuesses }).map((_, index) =>
            guesses[index] ? (
              renderGuessItem(guesses[index], index)
            ) : (
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
                <div
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    minWidth: '100px',
                    textAlign: 'center',
                  }}
                >
                  {`Guess ${index + 1}`}
                </div>
                <div
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    minWidth: '80px',
                    textAlign: 'center',
                  }}
                >
                  ---
                </div>
                <div
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    minWidth: '50px',
                    textAlign: 'center',
                  }}
                >
                  ---
                </div>
                <div
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    minWidth: '120px',
                    textAlign: 'center',
                  }}
                >
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
          <button onClick={() => setShowGuessTreemap((prev) => !prev)}>
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


      {/* OpenAI Chat Modal */}
      {/* <div style={{ marginTop: '2rem' }}>
        <button onClick={() => setShowAIChatModal(true)}>Show AI Chat</button>

      {/* OpenAI Chat
      <div style={{ marginTop: '2rem' }}>
        <OpenAIChat targetCountry={targetCountry} />
      </div> */}

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
        <GameResultModal modalType={modalType} gameBoard={gameBoard} onReset={resetGame} />
      )}

<div style={{ marginTop: '60px' }}></div>



      {/* World Map Modal */}
      {showWorldMap && <WorldMapModal showWorldMap={showWorldMap} setShowWorldMap={setShowWorldMap} />}
      <div style={{ marginTop: '2rem' }}>
        <button onClick={() => setShowWorldMap(true)}>Show World Map</button>
      </div>

      <div style={{ marginTop: '300px' }}></div>


    </div>
    
  );
}

export default Home;
