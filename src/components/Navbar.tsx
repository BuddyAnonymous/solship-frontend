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
      <ul className='navbar-balance-list'>
        <li className='bonk-image-div'>
          <img src="/images/bonk.png" alt="" className='bonk-image' />
        </li>
        <li className="navbar-balance">
                  <p className='bonk-balance-text'>Bonk Balance:</p> 
                  <span className="balance">{3}</span>
        </li>
        <li className="navbar-wallet">
          <WalletMultiButton />
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;