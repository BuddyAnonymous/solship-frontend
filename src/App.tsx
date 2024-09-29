import React, { useState } from 'react';
import './App.css';
import BuildBoard from './components/buildBoard';

function App() {
  const [play, setPlay] = useState(false);

  const handlePlayClick = () => {
    setPlay(true);
  };

  return (
    <div className="App">
      {!play ? (
        <div className="landing-page">
          <h1 className="title">Battleship</h1>
          <button className="play-button" onClick={handlePlayClick}>PLAY</button>
        </div>
      ) : (
        <BuildBoard/>
      )}
    </div>
  );
}

export default App;