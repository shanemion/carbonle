import React from 'react';
import './App.css';
import Home from './pages/Home';
import logo from './assets/CARBONLE_logo.png'; // Ensure the correct path

function App() {
  return (
    <div className="App" style={{ backgroundColor: '#F1F3E9', minHeight: '100vh' }}>
      <header className="App-header" style={{ backgroundColor: '#262A2E', padding: '1rem', textAlign: 'center' }}>
        <img 
          src={logo} 
          alt="CarbonLE Logo" 
          style={{ maxWidth: '400px', height: 'auto' }} 
        />
      </header>
      <main>
        <Home />
      </main>
    </div>
  );
}

export default App;