import React, { useEffect, useState } from 'react';
import { Keypair } from '@solana/web3.js';
import '../styles/Scoreboard.css';

const generateMockScores = (numPlayers: number) => {
  const mockScores = [];
  for (let i = 0; i < numPlayers; i++) {
    const player = Keypair.generate().publicKey.toString();
    const wins = Math.floor(Math.random() * 20);
    const losses = Math.floor(Math.random() * 20);
    const totalGames = wins + losses;
    mockScores.push({ player, wins, losses, totalGames });
  }
  return mockScores;
};

const Scoreboard = () => {
  const [scores, setScores] = useState<{ player: string; wins: number; losses: number; totalGames: number }[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      // Generate mock data
      const mockScores = generateMockScores(10); // Generate data for 10 players
      console.log("mockScores", mockScores);
      setScores(mockScores);
    };

    fetchScores();
  }, []);

  return (
    <div className="scoreboard">
      <h1>Scoreboard</h1>
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Total Games</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <tr key={index}>
              <td>{score.player}</td>
              <td>{score.wins}</td>
              <td>{score.losses}</td>
              <td>{score.totalGames}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Scoreboard;