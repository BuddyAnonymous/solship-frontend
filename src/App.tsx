import React, { useState } from 'react';
import Navbar from './components/Navbar';
import BuildBoard from './components/buildBoard';
import Scoreboard from './components/Scoreboard';
import { useMemo } from "react";
import {
	ConnectionProvider,
	WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
	WalletModalProvider,
	WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "./App.css";
import "./styles/wallet.css";


// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
	const [play, setPlay] = useState(false);
	// // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
	// const network = WalletAdapterNetwork.Devnet;
	// // You can also provide a custom RPC endpoint.
	// const endpoint = useMemo(() => clusterApiUrl(network), [network]);
	// You can also provide a custom RPC endpoint.
	const endpoint = useMemo(() => "http://127.0.0.1:8899", []);

	const handlePlayClick = () => {
		setPlay(true);
	};

	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider wallets={[]} autoConnect>
				<WalletModalProvider>
					<Router>
						<Navbar />
						{/* <div className="wallet-button-container">
								<WalletMultiButton />
							</div> */}
						<div className="App">
							<Routes>
								<Route path="/" element={!play ? (
									<div className="landing-page">
										<h1 className="title">Battleship</h1>
										<button className="play-button" onClick={handlePlayClick}>
											PLAY
										</button>
									</div>
								) : (
									<BuildBoard setPlay={setPlay}/>
								)} />
								<Route path="/scoreboard" element={<Scoreboard />} />
							</Routes>
						</div>
					</Router>
				</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}

export default App;