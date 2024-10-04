import React, { useEffect, useState } from 'react';
import Board from './Board';
import Ship from './Ship';
import EnemyBoard from './EnemyBoard.tsx';
import '../styles/buildBoard.css';
import { constructMerkleTree, printMerkleTree, MerkleNode } from '../merkleTree/merkleTree.ts';
import { GameEvent, program } from '../anchor/setup.ts';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Timer from './Timer';
import { set } from '@coral-xyz/anchor/dist/cjs/utils/features';

function BuildBoard() {
	const [SHIP_IMAGES, setSHIP_IMAGES] = useState([
		['/images/ship.png', 5, 'ship5'],
		['/images/ship.png', 4, 'ship4'],
		['/images/ship.png', 3, 'ship3-1'],
		['/images/ship.png', 3, 'ship3-2'],
		['/images/ship.png', 2, 'ship2'],
	]);

	const { connection } = useConnection();
	const { sendTransaction, publicKey } = useWallet();
	const [table, setTable] = useState(Array(10).fill(null).map(() => Array(10).fill(false)));
	const [globalDrag, setGlobalDrag] = useState(false);
	const [validSquares, setValidSquares] = useState(Array(10).fill(null).map(() => Array(10).fill(true)));
	const [isReady, setIsReady] = useState(false);
	const [shipsPlaced, setShipsPlaced] = useState(0);
	const [target, setTarget] = useState(null);
	const [merkleRoot, setMerkleRoot] = useState<MerkleNode | null>(null);

	const [game, setGame] = useState<GameEvent | null>(null);
	const [enemy, setEnemy] = useState<PublicKey | null>(null);
	const [fieldsEnemyAttacked, setFieldsEnemyAttacked] = useState(Array(10).fill(null).map(() => Array(10).fill(false)));
	const [turn, setTurn] = useState(1);

	const handleTimeUp = () => {
		setTurn(turn + 1);
	};

	function generateProof(fieldIndex: number) {
		const _merkleRoot: MerkleNode = constructMerkleTree(table)
		let dirArray: number[] = []
		while (dirArray.length < 7) {
			dirArray.unshift(fieldIndex % 2)
			fieldIndex = Math.ceil(fieldIndex / 2)
		}

		let currNode: MerkleNode = _merkleRoot
		let tempProof: string[] = []
		for (const num of dirArray) {
			if (num == 0) {
				tempProof.unshift(currNode.left?.hash!)
				currNode = currNode.right!
			}
			else {
				tempProof.unshift(currNode.right?.hash!)
				currNode = currNode.left!
			}
		}
		tempProof.push(_merkleRoot.hash)

		return tempProof

	}

	const handleReadyClick = async () => {
		const _merkleRoot: MerkleNode = constructMerkleTree(table);
		setMerkleRoot(_merkleRoot);
		setIsReady(true);
		printMerkleTree(_merkleRoot);

		const queue = (await program.account.queue.all()).at(0);
		console.log(queue);
		if (queue && queue.account.players.length == 0) {
			const tx = await program.methods.joinQueue(hexStringToByteArray(_merkleRoot.hash)).transaction();
			try {
				// Perform the Solana transaction
				const txSignature = await sendTransaction(
					tx,
					connection,
				);
				console.log("Transaction sent: ", txSignature);
			} catch (error) {
				console.error("Transaction error", error);
			}
		} else if (queue) {
			const enemy = queue.account.players[0];
			const tx = await program.methods.createGame(enemy.address, hexStringToByteArray(_merkleRoot.hash)).transaction();
			try {
				const txSignature = await sendTransaction(
					tx,
					connection,
				);
				console.log("Transaction sent: ", txSignature);
			} catch (error) {
				console.error("Transaction error", error);
			}
		}
	};

	async function handleAttackClick() {
		console.log(target);

		if (target !== null) {
			const tx = await program.methods.attack(target).transaction();
			try {
				const txSignature = sendTransaction(
					tx,
					connection,
				);
				console.log("Transaction sent: ", txSignature);
			} catch (error) {
				console.error("Transaction error", error);
			}
		}

		setTarget(null);
		setTurn(turn + 1);
		for (let i = 0; i < 100; i++) {
			document.getElementById(i + "-enemy").className = "enemy-board-square"
		}
	}

	function hexStringToByteArray(hexString: string): number[] {
		if (hexString.length % 2 !== 0) {
			throw new Error("Invalid hex string");
		}

		const byteArray: number[] = [];

		for (let i = 0; i < hexString.length; i += 2) {
			const byte = parseInt(hexString.substr(i, 2), 16);
			byteArray.push(byte);
		}

		return byteArray;
	}

	function indexToCoords(index: number): [number, number] {
		return [Math.floor(index / 10), index % 10];
	}

	program.addEventListener('gameStarted', (gameStarted) => {
		const selfPublicKey = publicKey;
		if (gameStarted.player1 !== selfPublicKey && gameStarted.player2 !== selfPublicKey) return;

		if (gameStarted.player1 === selfPublicKey) {
			setEnemy(gameStarted.player2);
		} else {
			setEnemy(gameStarted.player1);
		}

		console.log("Game started", gameStarted);
		setGame(game);
	});

	program.addEventListener('turnFinished', (turnFinished) => {
		if (turnFinished.game !== game?.game) return;

		console.log("Turn finished", turnFinished);
	});

	program.addEventListener('fieldAttacked', async (fieldAttacked) => {
		if (fieldAttacked.game !== game?.game) return;

		if (fieldAttacked.player === enemy) {
			const attackedField = fieldAttacked.attackedField;

			setFieldsEnemyAttacked((prev) => {
				const newFieldsEnemyAttacked = [...prev];
				const [row, col] = indexToCoords(attackedField);
				newFieldsEnemyAttacked[row][col] = true;
				return newFieldsEnemyAttacked;
			});

			const proof = generateProof(attackedField);

			const [row, col] = indexToCoords(attackedField);
			const tx = await program.methods.verifyProof(proof, { index: attackedField, ship_placed: table[row][col] }).transaction();

			try {
				const txSignature = sendTransaction(
					tx,
					connection,
				);
				console.log("Transaction sent: ", txSignature);
			} catch (error) {
				console.error("Transaction error", error);
			}
		}

		console.log("Field attacked: ", fieldAttacked);
	});

	program.addEventListener('proofVerified', (proofVerified) => {
		if (proofVerified.game !== game?.game) return;

		console.log("Proof verified: ", proofVerified);
	});

	program.addEventListener('gameFinished', (gameFinished) => {
		if (gameFinished.game !== game?.game) return;

		console.log("Game finished", gameFinished);
	});

	return (
		isReady ? (
			<div className="game-container">
				<div>
					<h2 style={{ color: 'teal', textShadow: '2px 2px 5px rgba(0,0,0,0.5)' }}>Turn: {turn}</h2>
					<Timer onTimeUp={handleTimeUp} turn={turn} />
				</div>
				<div className="board-container">
					<Board table={table} dragging={false} validSquares={validSquares} isReady={isReady} setTable={setTable} setValidSquares={setValidSquares} />
				</div>
				<div className="board-container">
					<EnemyBoard target={target} setTarget={setTarget} merkleRoot={merkleRoot} />
				</div>
				<div className={target != null ? "attack-button" : "attack-button-locked"} onClick={target != null ? handleAttackClick : null}>ATTACK</div>
				<div className='guide'>
					<h1>HOW TO PLAY:</h1>
					DRAG SHIP TO PLACE
					<br />
					PRESS R WHILE DRAGGING TO ROTATE
				</div>
			</div>
		) : (
			<div className="build-board-container">
				<div className="sidebar">
					{SHIP_IMAGES.map((src, index) => (
						<Ship
							SHIP_IMAGES={SHIP_IMAGES}
							setSHIP_IMAGES={setSHIP_IMAGES}
							key={`${SHIP_IMAGES[index][2]}`}
							id={SHIP_IMAGES[index][2]}
							src={src[0]}
							alt={`Ship ${index + 1}`}
							style={{ width: `${src[1] * 50}px`, height: '50px' }} // Set width based on length and consistent height
							table={table}
							setTable={setTable}
							sqWidth={src[1]}
							globalDrag={globalDrag}
							setGlobalDrag={setGlobalDrag}
							validSquares={validSquares}
							setValidSquares={setValidSquares}
							shipsPlaced={shipsPlaced}
							setShipsPlaced={setShipsPlaced}
						/>
					))}
				</div>
				<div className="board-and-button">
					<Board table={table} dragging={globalDrag} validSquares={validSquares} isReady={isReady} setTable={setTable} setValidSquares={setValidSquares} SHIP_IMAGES={SHIP_IMAGES} setSHIP_IMAGES={setSHIP_IMAGES} shipsPlaced={shipsPlaced} setShipsPlaced={setShipsPlaced} />
					<button className={shipsPlaced == 5 ? "ready-button" : "not-ready-button"} onClick={shipsPlaced == 5 ? handleReadyClick : null} >I'm ready</button>
				</div>
			</div>
		)
	);
}

export default BuildBoard;