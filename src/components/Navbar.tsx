import React from 'react';
import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '../styles/Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/" className="navbar-link">Battleship</Link>
      </div>
      <ul className="navbar-list">
        <li className="navbar-item">
          <Link to="/" className="navbar-link">Play</Link>
        </li>
        <li className="navbar-item">
          <Link to="/scoreboard" className="navbar-link">Scoreboard</Link>
        </li>
      </ul>
      <div className="navbar-wallet">
        <WalletMultiButton />
      </div>
    </nav>
  );
};

export default Navbar;