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
import { ProgramAccount } from '@coral-xyz/anchor';
import axios from 'axios';

enum GameWinner {
	WINNER,
	LOSER,
	DRAW,
	NONE
}

function BuildBoard({ setPlay }: { setPlay: (play: boolean) => void }) {
	const [SHIP_IMAGES, setSHIP_IMAGES] = useState([
		['/images/ship.png', 5, 'ship5'],
		['/images/ship.png', 4, 'ship4'],
		['/images/ship.png', 3, 'ship3-1'],
		['/images/ship.png', 3, 'ship3-2'],
		['/images/ship.png', 2, 'ship2'],
	]);


	const { connection } = useConnection();
	const { sendTransaction, publicKey } = useWallet();
	const [table, setTable] = useState(() => {
		const savedTable = localStorage.getItem('table');
		return savedTable ? JSON.parse(savedTable) : Array(10).fill(null).map(() => Array(10).fill(false));
	});
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
	const [secrets, setSecrets] = useState(null);
	const [enemyRemainingShipFields, setEnemyRemainingShipFields] = useState(() => {
		const storedValue = localStorage.getItem("enemyRemainingShipFields");
		return storedValue ? parseInt(storedValue, 10) : 17; // Replace initialEnemyRemainingShipFields with your initial value
	  });
	const [isInQueue, setIsInQueue] = useState(false);
	const [queueAccount, setQueueAccount] = useState<ProgramAccount<{ players: any[]; }> | null>(null);

	useEffect(() => {
		localStorage.setItem('table', JSON.stringify(table));
	}, [table]);

	useEffect(() => {
		if (secrets !== null) {
			localStorage.setItem('secrets', JSON.stringify(secrets));
		}
	}, [secrets]);


	const isSubscribed = useRef(false);
	// const gameRef = useRef(game);
	// const turnRef = useRef(turn);
	// const fieldsEnemyAttackedRef = useRef(fieldsEnemyAttacked);
	// const attackedFieldsRef = useRef(attackedFields);
	// const enemyShipsRef = useRef(enemyShips);
	// const tableRef = useRef(table);
	// const secretsRef = useRef(secrets);

	// useEffect(() => {
	// 	game = game;
	// 	turn = turn;
	// 	fieldsEnemyAttacked = fieldsEnemyAttacked;
	// 	attackedFields = attackedFields;
	// 	enemyShips = enemyShips;
	// 	table = table;
	// 	secrets = secrets;
	// }, [game, turn, fieldsEnemyAttacked, attackedFields, enemyShips, table, secrets]);


	useEffect(() => {
        if (publicKey) {
            loadGameState();
        }
    }, [publicKey]);

	useEffect(() => {
		const checkWin = async () => {
			console.log("Enemy remaining ship fields: ", enemyRemainingShipFields);
			if (enemyRemainingShipFields === 0) await claimWin();
		};
		checkWin();
	}, [enemyRemainingShipFields]);

	useEffect(() => {
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
			saveGameState(publicKey, gameStarted.game, gameStarted.player1, gameStarted.player2, 1, table, fieldsEnemyAttacked, attackedFields, enemyShips);
			setTurn(1);
			setTimerRunning(true);
			setIsInQueue(false);

			setGame(gameStarted);

			console.log("Game started: ", gameStarted);
		});

		const subId2 = program.addEventListener('turnFinished', (turnFinished) => {
			if (game == null) return;
			if (turnFinished.game.toBase58() !== game?.game.toBase58()) return;

			setTurn((prev) => {
				const nextTurn = prev + 1;
				console.log("Next turn test: ", nextTurn);
				saveGameState(publicKey, game.game, game.player1, game.player2, nextTurn, null, null, null, null);

				return nextTurn;
			});
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

				setFieldsEnemyAttacked(prevFields => {
					const updatedFieldsEnemyAttacked = prevFields.map(row => [...row]);
					const [row, col] = indexToCoords(attackedField);
					updatedFieldsEnemyAttacked[row][col] = true;
					console.log("updatedFieldsEnemyAttacked test: ", updatedFieldsEnemyAttacked);
					saveGameState(publicKey, game.game, game.player1, game.player2, null, null, updatedFieldsEnemyAttacked, null, null);

					return updatedFieldsEnemyAttacked;
				});

				const proof = generateProof(attackedField);

				const [row, col] = indexToCoords(attackedField);
				console.log("Sending proof: ", { index: attackedField, ship_placed: table[row][col], secret32: secrets[row][col] });
				console.log("Sending proof proof: ", proof);
				const tx = await sessionProgram.methods.verifyProof(proof, { index: attackedField, shipPlaced: table[row][col], secret32: secrets[row][col] })
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
					.rpc({
						skipPreflight: true,
					})


				console.log("Field attacked: ", fieldAttacked);
			})();
		});

		const subId4 = program.addEventListener('proofVerified', (proofVerified) => {
			if (game == null) return;
			if (proofVerified.game.toBase58() !== game!?.game.toBase58()) return;

			if (proofVerified.player.toBase58() !== enemy?.toBase58()) return;

			if (proofVerified.shipPlaced === true) {
				setEnemyRemainingShipFields((prev) => {
					const newValue = prev - 1;
					localStorage.setItem("enemyRemainingShipFields", newValue.toString());
					return newValue;
				  });

				setEnemyShips(prevShips => {
					const updatedEnemyShips = prevShips.map(row => [...row]);
					const [row, col] = indexToCoords(proofVerified.attackedField);
					updatedEnemyShips[row][col] = true;
					console.log("updatedEnemyShips test: ", updatedEnemyShips);
					saveGameState(publicKey, game.game, game.player1, game.player2, null, null, null, null, updatedEnemyShips);

					return updatedEnemyShips;
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

		// isSubscribed.current = true;

		return () => {
			// program.removeEventListener(subId1);
			// program.removeEventListener(subId2);
			// program.removeEventListener(subId3);
			// program.removeEventListener(subId4);
			// program.removeEventListener(subId5);
		};
	}, [game]);

	const handleTimeUp = async () => {
		// await claimWin();
	};

	async function claimWin() {
		// Create an array with 28 padding leaves
		// const paddingLeaves = Array(28).fill(null).map((_, index) => {
		// 	return {
		// 		shipPlaced: false,
		// 		//   secret: new anchor.BN(0),
		// 	};
		// });

		const claimWinParam = table.flat().map((cell, index) => {
			return ({ shipPlaced: cell });
		});

		const secretsClaimWinParam = secrets!.flat();

		try {
			const tx = await sessionProgram.methods.claimWin(claimWinParam, secretsClaimWinParam)
				.accounts({
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
		const dirArray: number[] = []
		while (dirArray.length < 7) {
			dirArray.unshift(fieldIndex % 2)
			fieldIndex = Math.ceil(fieldIndex / 2)
		}

		let currNode: MerkleNode = merkleRoot!
		const tempProof: string[] = []
		for (const num of dirArray) {
			if (num == 0) {
				if (currNode.left?.hash) {
					tempProof.unshift(currNode.left.hash);
				}
				else {
					throw new Error('Left node hash is undefined');
				}
				currNode = currNode.right!
			}
			else {
				if (currNode.right?.hash) {
					tempProof.unshift(currNode.right.hash);
				} else {
					throw new Error('Right node hash is undefined');
				}
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

	const saveGameState = async (
		thisPlayer: PublicKey | null,
		gamePubkey: PublicKey,
		player1: PublicKey,
		player2: PublicKey,
		turn: number | null,
		table: any[][] | null,
		fieldsEnemyAttacked: any[][] | null,
		attackedFields: number[] | null,
		enemyShips: any[][] | null
	) => {
		const updateData: any = {};
		if (turn !== null) updateData.turn = turn;
		if (table !== null) updateData.table = table;
		if (fieldsEnemyAttacked !== null) updateData.fieldsEnemyAttacked = fieldsEnemyAttacked;
		if (attackedFields !== null) updateData.attackedFields = attackedFields;
		if (enemyShips !== null) updateData.enemyShips = enemyShips;

		const data = {
			thisPlayer,
			gamePubkey,
			player1,
			player2,
			updateData
		};

		console.log("Saving game state: ", data);

		await axios.post('http://localhost:3000/game/upsert', data);
	};

	// Function to load game state
	const loadGameState = async () => {
		try {
			const selfPublicKey = publicKey?.toBase58();
			const response = await axios.get('http://localhost:3000/game/load', {
				params: { selfPlayer: selfPublicKey }
			});
			console.log("Self public key: ", selfPublicKey);
			console.log("Full response: ", response);
			console.log("Loaded game state: ", response.data);

			if (response.data) {
				const { thisPlayer, gamePubkey, player1, player2, turn, table, fieldsEnemyAttacked, attackedFields, enemyShips } = response.data;
				setGame({ game: new PublicKey(gamePubkey), player1: new PublicKey(player1), player2: new PublicKey(player2) });
				setFieldsEnemyAttacked(fieldsEnemyAttacked); // Assuming setValidSquares is used for fieldsEnemyAttacked
				setAttackedFields(attackedFields); // Assuming setTarget is used for attackedFields
				setEnemyShips(enemyShips);
				setTurn(turn);
				setTimerRunning(true);
				setIsInQueue(false);
				setPlay(true);
				setIsReady(true);
				setEnemy(player1 === selfPublicKey ? new PublicKey(player2) : new PublicKey(player1));
				const enemyRemainingShipFields = localStorage.getItem("enemyRemainingShipFields");
				const enemyRemainingShipFieldsNumber = enemyRemainingShipFields ? parseInt(enemyRemainingShipFields, 10) : 17; 
				setEnemyRemainingShipFields(enemyRemainingShipFieldsNumber);

				const savedTable = localStorage.getItem('table');
				const savedSecrets = localStorage.getItem('secrets');

				if (savedTable) {
					console.log("Saved table: ", JSON.parse(savedTable));
					setTable(JSON.parse(savedTable));
				}

				if (savedSecrets) {
					setSecrets(JSON.parse(savedSecrets));
				}

				const storedMerkleRoot = localStorage.getItem('merkleRoot');
				if (storedMerkleRoot) {
				  const parsedMerkleRoot = parseMerkleNode(JSON.parse(storedMerkleRoot));
				  setMerkleRoot(parsedMerkleRoot);
				  console.log("Retrieved _merkleRoot from local storage: ", parsedMerkleRoot);
				}

			} else {
				console.warn("No data returned from API");
			}
		} catch (error) {
			console.error("Error loading game state: ", error);
		}
	};

	const parseMerkleNode = (data: any): MerkleNode => {
		if (!data) return null;
		return {
		  hash: data.hash,
		  left: data.left ? parseMerkleNode(data.left) : undefined,
		  right: data.right ? parseMerkleNode(data.right) : undefined,
		  data: data.data,
		  secret: data.secret,
		  fieldIndex: data.fieldIndex,
		};
	  };

	const handleReadyClick = async () => {
		const [_merkleRoot, _secrets] = await constructMerkleTree(table);
		localStorage.setItem('merkleRoot', JSON.stringify(_merkleRoot));
		
		setSecrets(_secrets);
		setMerkleRoot(_merkleRoot);
		setIsReady(true);
		printMerkleTree(_merkleRoot);
		setIsInQueue(true);

		const queue = (await program.account.queue.all()).at(0);
		setQueueAccount(queue);

		console.log(queue);
		if (queue && queue.account.players.length == 0) {
			console.log("Joining queue: ", program);
			const tx = await program.methods.joinQueue(hexStringToByteArray(_merkleRoot.hash))
				.accountsPartial({
					queue: queue.publicKey,
					player: publicKey!,
					sessionKey: sessionKey!.publicKey,
					systemProgram: SystemProgram.programId,
					// playerStats: 
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
				const blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
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
		setIsInQueue(false);
		setIsReady(false);

		const tx = await program.methods.exitQueue()
			.accountsPartial({
				queue: queueAccount!.publicKey,
				player: publicKey!,
				sessionKey: sessionKey!.publicKey,
				systemProgram: SystemProgram.programId,
				// playerStats: 
			})
			.preInstructions([
				SystemProgram.transfer({
					fromPubkey: sessionKey!.publicKey,
					toPubkey: publicKey!,
					lamports: 500 * LAMPORTS_PER_SOL,
				})
			])
			// .signers([sessionKey!])
			.transaction();
		try {
			const blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
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
	}

	async function handleAttackClick() {
		const fieldIndex = parseInt(target.split("-")[0]);

		if (target !== null) {
			// Create a local variable to hold the updated state
			const newAttackedFields = [...attackedFields, parseInt(target.split("-")[0])];

			// Update the state using the local variable
			setAttackedFields(newAttackedFields);

			// Use the local variable to access the updated state
			console.log("New attacked fields: ", newAttackedFields);

			const tx = await sessionProgram.methods.attack(fieldIndex)
				.accounts({
					game: game!.game,
					player: sessionKey!.publicKey,
				})
				.signers([sessionKey!])
				.rpc({
					skipPreflight: true,
				});

			console.log("New attacked fields test: ", newAttackedFields);
			// Use the local variable to pass the updated state to saveGameState or other functions
			saveGameState(publicKey, game!.game, game!.player1, game!.player2, null, null, null, newAttackedFields, null);

			setTarget(null);
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
						{isInQueue ? <div style={{}}>
							<p style={{ color: "white", fontSize: "40px", textShadow: "5px 5px 12px rgba(100, 23, 235, 0.5)" }}>LOOKING FOR AN OPPONENT...</p>
							<button className="ready-button" onClick={handleLeaveQueue}>LEAVE QUEUE</button>
						</div> : <div>
							<div className="board-container">
								<EnemyBoard target={target} setTarget={setTarget} attackedFields={attackedFields} enemyShips={enemyShips} />
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