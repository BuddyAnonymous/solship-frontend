import React, { useEffect, useRef, useState } from 'react';
import Board from './Board';
import Ship from './Ship';
import EnemyBoard from './EnemyBoard.tsx';
import '../styles/buildBoard.css';
import { constructMerkleTree, printMerkleTree, MerkleNode } from '../merkleTree/merkleTree.ts';
import { GameEvent, program, sessionProgram } from '../anchor/setup.ts';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Enum, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram } from '@solana/web3.js';
import Timer from './Timer';
import { ComputeBudgetProgram } from '@solana/web3.js';
import { Keypair } from '@solana/web3.js';
import { sessionKey } from '../anchor/setup.ts';
import { set } from '@coral-xyz/anchor/dist/cjs/utils/features';

enum GameWinner {
	WINNER,
	LOSER,
	DRAW,
	NONE
}

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
	const [attackedFields, setAttackedFields] = useState<number[]>([]);
	const [timerRunning, setTimerRunning] = useState(false);
	const [game, setGame] = useState<GameEvent | null>(null);
	const [enemy, setEnemy] = useState<PublicKey | null>(null);
	const [fieldsEnemyAttacked, setFieldsEnemyAttacked] = useState(Array(10).fill(null).map(() => Array(10).fill(false)));
	const [turn, setTurn] = useState(1);
	const [enemyShips, setEnemyShips] = useState(Array(10).fill(null).map(() => Array(10).fill(false)));
	const [gameWinner, setGameWinner] = useState(GameWinner.NONE);
	const [secrets, setSecrets] = useState<number[][] | null>(null);
	const [enemyRemainingShipFields, setEnemyRemainingShipFields] = useState(17);
	const [isInQueue, setInQueue] = useState(true);

	const isSubscribed = useRef(false);

	useEffect(() => {
		const checkWin = async () => {
			console.log("Enemy remaining ship fields: ", enemyRemainingShipFields);
			if (enemyRemainingShipFields === 0) await claimWin();
		};
		checkWin();
	}, [enemyRemainingShipFields]);

	useEffect(() => {
		// const fetchGameTest = async () => {
		// 	const gameTest = await program.account.game.all();
		// 	console.log(gameTest);
		// };
		// fetchGameTest();

		if (isSubscribed.current) return;

		const subId1 = program.addEventListener('gameStarted', (gameStarted) => {
			const selfPublicKey = publicKey;
			console.log("Self public key: ", selfPublicKey);
			if (gameStarted.player1.toBase58() !== selfPublicKey?.toBase58() && gameStarted.player2.toBase58() !== selfPublicKey?.toBase58()) return;

			if (gameStarted.player1.toBase58() === selfPublicKey!.toBase58()) {
				setEnemy(gameStarted.player2);
			} else {
				setEnemy(gameStarted.player1);
			}

			setTurn(1);
			setTimerRunning(true);

			setGame(gameStarted);
			console.log("Game started: ", gameStarted);
		});

		const subId2 = program.addEventListener('turnFinished', (turnFinished) => {
			if (game == null) return;
			if (turnFinished.game.toBase58() !== game?.game.toBase58()) return;

			setTurn((prev) => prev + 1);
			console.log("Turn finished", turnFinished);
		});

		const subId3 = program.addEventListener('fieldAttacked', (fieldAttacked) => {
			if (game == null) return;
			(async () => {
				// ignore if not the current game
				if (fieldAttacked.game.toBase58() !== game?.game.toBase58()) return;
				// ignore if the field was attacked by self
				if (fieldAttacked.player.toBase58() === publicKey?.toBase58()) return;

				const attackedField = fieldAttacked.attackedField;

				console.log("Enemy attacked field: ", attackedField);

				setFieldsEnemyAttacked((prev) => {
					const newFieldsEnemyAttacked = [...prev];
					const [row, col] = indexToCoords(attackedField);
					newFieldsEnemyAttacked[row][col] = true;
					return newFieldsEnemyAttacked;
				});

				const proof = generateProof(attackedField);

				const [row, col] = indexToCoords(attackedField);
				console.log("Sending proof: ", { index: attackedField, ship_placed: table[row][col] });
				const tx = await sessionProgram.methods.verifyProof(proof, { index: attackedField, shipPlaced: table[row][col]})
					.accounts({
						player: sessionKey!.publicKey,
						game: game?.game,
					})
					.preInstructions([
						ComputeBudgetProgram.setComputeUnitLimit({
							units: 1_400_000
						})
					])
					.signers([sessionKey!])
					.rpc()

				// const tx = await program.methods.verifyProof(proof, { index: attackedField, shipPlaced: table[row][col] })
				// 	.accounts({
				// 		player: publicKey!,
				// 		game: game?.game,
				// 	})
				// 	.preInstructions([
				// 		ComputeBudgetProgram.setComputeUnitLimit({
				// 			units: 1_400_000
				// 		})
				// 	])
				// 	.transaction();

				// try {
				// 	const txSignature = await sendTransaction(
				// 		tx,
				// 		connection,
				// 		{
				// 			skipPreflight: true,
				// 		}
				// 	);
				// 	console.log("Transaction sent: ", txSignature);
				// } catch (error) {
				// 	console.error("Transaction error", error);
				// }

				console.log("Field attacked: ", fieldAttacked);
			})();
		});

		const subId4 = program.addEventListener('proofVerified', (proofVerified) => {
			if (game == null) return;
			if (proofVerified.game.toBase58() !== game!?.game.toBase58()) return;

			if (proofVerified.player.toBase58() !== enemy?.toBase58()) return;

			if (proofVerified.shipPlaced === true) {
				setEnemyRemainingShipFields((prev) => prev - 1);

				setEnemyShips((prev) => {
					const [row, col] = indexToCoords(proofVerified.attackedField);
					const newEnemyShips = [...prev];
					newEnemyShips[row][col] = true;
					console.log("Enemy ships: ", newEnemyShips);
					return newEnemyShips;
				});
			}

			console.log("Proof verified: ", proofVerified);
		});

		const subId5 = program.addEventListener('gameFinished', (gameFinished) => {
			if (game == null) return;
			console.log("Game finished", gameFinished);

			if (gameFinished.game.toBase58() !== game?.game.toBase58()) return;

			if (gameFinished.winner.toBase58() === publicKey?.toBase58()) {
				console.log("You won!");
				setGameWinner(GameWinner.WINNER);
			}
			if (gameFinished.winner.toBase58() === enemy?.toBase58()) {
				console.log("You lost!");
				setGameWinner(GameWinner.LOSER);
			}
			if (gameFinished.winner.toBase58() === PublicKey.default.toBase58()) {
				console.log("Draw!");
				setGameWinner(GameWinner.DRAW);
			}

		});

		// return () => {
		// 	program.removeEventListener(subId1);
		// 	program.removeEventListener(subId2);
		// 	program.removeEventListener(subId3);
		// 	program.removeEventListener(subId4);
		// 	program.removeEventListener(subId5);
		// };
	}, [game]);

	const handleTimeUp = async () => {
		// await claimWin();
	};

	async function claimWin() {
		// Create an array with 28 padding leaves
		const paddingLeaves = Array(28).fill(null).map((_, index) => {
			// const ind = index + 100;
			// const row = Math.floor(ind / 10);
			// const col = ind % 10;

			return {
			  shipPlaced: false,
			//   secret: new anchor.BN(0),
			};
		  });

		const claimWinParam = table.flat().map((cell, index) => {
			return ({ shipPlaced: cell });
		}).concat(paddingLeaves);

		try {
			const tx = await sessionProgram.methods.claimWin(claimWinParam)
				.accountsStrict({
					game: game!.game,
					player: sessionKey.publicKey,
				})
				.preInstructions([
					ComputeBudgetProgram.setComputeUnitLimit({
						units: 1_400_000
					})
				])
				.signers([sessionKey])
				.rpc({
					skipPreflight: true,
				})
		}
		catch (err) {
			console.log(err);
		}
	}

	function generateProof(fieldIndex: number) {
		// const _merkleRoot: MerkleNode = constructMerkleTree(table)
		fieldIndex = fieldIndex + 1;
		let dirArray: number[] = []
		while (dirArray.length < 7) {
			dirArray.unshift(fieldIndex % 2)
			fieldIndex = Math.ceil(fieldIndex / 2)
		}

		let currNode: MerkleNode = merkleRoot!
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
		// tempProof.push(merkleRoot!.hash)

		// Convert hex strings to 32-byte arrays
		const proofAsByteArrays = tempProof.map(hex => {
			const buffer = Buffer.from(hex, 'hex')
			if (buffer.length !== 32) {
				throw new Error('Hash is not 32 bytes long')
			}
			return Array.from(buffer)
		})

		// console.log("Proof: ", proofAsByteArrays);
		console.log("Proof array: ", tempProof);

		return proofAsByteArrays;

	}

	const handleReadyClick = async () => {
		const [_merkleRoot, _secrets] = await constructMerkleTree(table);
		setSecrets(_secrets);
		setMerkleRoot(_merkleRoot);
		setIsReady(true);
		printMerkleTree(_merkleRoot);
		setInQueue(true);

		const queue = (await program.account.queue.all()).at(0);
		console.log(queue);
		if (queue && queue.account.players.length == 0) {
			console.log("Joining queue: ", program);
			const tx = await program.methods.joinQueue(hexStringToByteArray(_merkleRoot.hash))
				.accountsStrict({
					queue: queue.publicKey,
					player: publicKey!,
					sessionKey: sessionKey!.publicKey,
					systemProgram: SystemProgram.programId,
				})
				.preInstructions([
					SystemProgram.transfer({
						fromPubkey: publicKey!,
						toPubkey: sessionKey!.publicKey,
						lamports: 500 * LAMPORTS_PER_SOL,
					})
				])
				// .signers([sessionKey!])
				.transaction();
			try {
				let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
				tx.recentBlockhash = blockhash;
				tx.feePayer = publicKey!;
				tx.partialSign(sessionKey!);

				// Perform the Solana transaction
				const txSignature = await sendTransaction(
					tx,
					connection,
					{
						skipPreflight: true,
					}
				);
				console.log("Transaction sent: ", txSignature);
			} catch (error) {
				console.error("Transaction error", error);
			}
		} else if (queue) {
			const enemy = queue.account.players[0];
			const [gameAddr] = PublicKey.findProgramAddressSync([Buffer.from("game"), publicKey!.toBuffer(), new PublicKey(enemy.address).toBuffer()], program.programId);
			const tx = await program.methods.createGame(enemy.address, hexStringToByteArray(_merkleRoot.hash))
				.accounts({
					// game: gameAddr,
					player: publicKey!,
					sessionKey: sessionKey!.publicKey,
					// queue: queue.publicKey,
				})
				.preInstructions([
					SystemProgram.transfer({
						fromPubkey: publicKey!,
						toPubkey: sessionKey!.publicKey,
						lamports: 500 * LAMPORTS_PER_SOL,
					})
				])
				// .signers([sessionKey!])
				.transaction();
			try {
				let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
				tx.recentBlockhash = blockhash;
				tx.feePayer = publicKey!;
				tx.partialSign(sessionKey!);
				
				const txSignature = await sendTransaction(
					tx,
					connection,
					{
						skipPreflight: true,
					}
				);
				console.log("Transaction sent: ", txSignature);
			} catch (error) {
				console.error("Transaction error", error);
			}
		}
	};

	const handleLeaveQueue = async () => {
		setInQueue(false);
		setIsReady(false);
	}

	async function handleAttackClick() {
		const fieldIndex = parseInt(target.split("-")[0]);

		if (target !== null) {
			setAttackedFields(prev => [...prev, parseInt(target.split("-")[0])]);
		}

		setTarget(null);
		if (target !== null) {
			const tx = await sessionProgram.methods.attack(fieldIndex)
				.accounts({
					game: game!.game,
					player: sessionKey!.publicKey,
				})
				.signers([sessionKey!])
				.rpc({
					skipPreflight: true,
				});

			// const tx = await program.methods.attack(fieldIndex)
			// 	.accounts({
			// 		game: game!.game,
			// 		player: publicKey!,
			// 	})
			// 	.transaction();
			// try {
			// 	const txSignature = await sendTransaction(
			// 		tx,
			// 		connection,
			// 		{
			// 			skipPreflight: true,
			// 		}
			// 	);
			// 	console.log("Transaction sent: ", txSignature);
			// } catch (error) {
			// 	console.error("Transaction error", error);
			// }
		}

		setTarget(null);
		// setTurn(turn + 1);
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


	const renderGameState = (winner: GameWinner) => {
		switch (winner) {
			case GameWinner.WINNER:
				return <h1 style={{ color: 'green', textShadow: '2px 2px 5px rgba(255,255,255,0.15)', fontSize: '80px', marginBottom: '20px' }}>YOU WON!</h1>;
			case GameWinner.LOSER:
				return <h1 style={{ color: 'red', textShadow: '2px 2px 5px rgba(255,255,255,0.15)', fontSize: '80px', marginBottom: '20px' }}>YOU LOST!</h1>;
			case GameWinner.DRAW:
				return <h1 style={{ color: 'yellow', textShadow: '2px 2px 5px rgba(255,255,255,0.15)', fontSize: '80px', marginBottom: '20px' }}>DRAW!</h1>;
			default:
				return (<div>
					<h2 style={{ color: 'teal', textShadow: '2px 2px 5px rgba(255,255,255,0.15)' }}>Turn: {turn}</h2>
					<Timer onTimeUp={handleTimeUp} turn={turn} running={timerRunning} />
				</div>);

		}
	};

	return (
		isReady ? (
			isInQueue ? (
			<div style={{ marginBottom: '100px' }}>
				{isInQueue ? null : <div style={{ marginRight: '200px' }}>
					{renderGameState(gameWinner)}
				</div>}
				<div className="game-container">
					<div className="board-container">
						<Board table={table} dragging={false} validSquares={validSquares} isReady={isReady} setTable={setTable} setValidSquares={setValidSquares} fieldsEnemyAttacked={fieldsEnemyAttacked} />
					</div>
					{isInQueue ? <div style={{ }}>
					<p style={{color : "white", fontSize: "40px", textShadow: "5px 5px 12px rgba(100, 23, 235, 0.5)"}}>LOOKING FOR AN OPPONENT...</p>
					<button className="ready-button" onClick={handleLeaveQueue}>LEAVE QUEUE</button>
				</div> : <div>
						<div className="board-container">
							<EnemyBoard target={target} setTarget={setTarget} merkleRoot={merkleRoot} attackedFields={attackedFields} enemyShips={enemyShips} />
						</div>
						<div className={target != null ? "attack-button" : "attack-button-locked"} onClick={target != null ? handleAttackClick : null}>ATTACK</div>
					</div>}
				</div>
			</div>

			) : (
				<div style={{ marginBottom: '100px' }}>
				<div style={{ marginRight: '200px' }}>
					{renderGameState(gameWinner)}
				</div>
				<div className="game-container">
					<div className="board-container">
						<Board table={table} dragging={false} validSquares={validSquares} isReady={isReady} setTable={setTable} setValidSquares={setValidSquares} fieldsEnemyAttacked={fieldsEnemyAttacked} />
					</div>
						<div className="board-container">
							<EnemyBoard target={target} setTarget={setTarget} merkleRoot={merkleRoot} attackedFields={attackedFields} enemyShips={enemyShips} />
						</div>
						<div className={target != null ? "attack-button" : "attack-button-locked"} onClick={target != null ? handleAttackClick : null}>ATTACK</div>
				</div>
			</div>
			)
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
					<Board table={table} dragging={globalDrag} validSquares={validSquares} isReady={isReady} setTable={setTable} setValidSquares={setValidSquares} SHIP_IMAGES={SHIP_IMAGES} setSHIP_IMAGES={setSHIP_IMAGES} shipsPlaced={shipsPlaced} setShipsPlaced={setShipsPlaced} fieldsEnemyAttacked={fieldsEnemyAttacked} />
					<button className={shipsPlaced == 5 ? "ready-button" : "not-ready-button"} onClick={shipsPlaced == 5 ? handleReadyClick : null} >I'm ready</button>
				</div>
				<div className='guide'>
					<h1>HOW TO PLAY:</h1>
					DRAG SHIP TO PLACE
					<br />
					PRESS R WHILE DRAGGING TO ROTATE
				</div>
			</div>
		)
	);
}

export default BuildBoard;