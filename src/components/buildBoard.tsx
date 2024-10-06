import React, { useEffect, useState } from 'react';
import Board from './Board';
import Ship from './Ship';
import EnemyBoard from './EnemyBoard.tsx';
import '../styles/buildBoard.css';
import { constructMerkleTree, printMerkleTree, MerkleNode } from '../merkleTree/merkleTree.ts';
import { program } from '../anchor/setup.ts';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
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
  const { sendTransaction } = useWallet();
  const [table, setTable] = useState(Array(10).fill(null).map(() => Array(10).fill(false)));
  const [globalDrag, setGlobalDrag] = useState(false);
  const [validSquares, setValidSquares] = useState(Array(10).fill(null).map(() => Array(10).fill(true)));
  const [isReady, setIsReady] = useState(false);
  const [shipsPlaced, setShipsPlaced] = useState(0);
  const [target, setTarget] = useState<string | null>(null);
  const [merkleRoot, setMerkleRoot] = useState<MerkleNode | null>(null);
  const [turn, setTurn] = useState(1);
  const [attackedFields, setAttackedFields] = useState<number[]>([]);
  
  const handleTimeUp = () => {
    setTurn(turn + 1);
  };

  function generateProof(fieldIndex: number) {
    const _merkleRoot: MerkleNode = constructMerkleTree(table)
    let dirArray : number[] = []
    while(dirArray.length < 7){
        dirArray.unshift(fieldIndex % 2)
        fieldIndex = Math.ceil(fieldIndex / 2)
    }

    let currNode: MerkleNode = _merkleRoot
    let tempProof: string[] = []
    for(const num of dirArray){
        if(num == 0){
            tempProof.unshift(currNode.left?.hash!)
            currNode = currNode.right!
        }
        else{
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

  function handleAttackClick() {
    console.log(target);

    if (target !== null) {
      setAttackedFields(prev => [...prev, parseInt(target.split("-")[0])]);
      program.methods.attack(target).rpc();
    }

    setTarget(null);
    setTurn(turn + 1);
    for (let i = 0; i < 100; i++) {
      const element = document.getElementById(i + "-enemy");
      if(element && element.className === "enemy-square-clicked") {
        element.className = "enemy-board-square";
      }
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

  return (
    isReady ? (
      <div style={{marginBottom:'100px'}}>
        <div style={{marginBottom: '50px', marginRight: '200px'}}>
                  <h2 style={{ color: 'teal', textShadow:'2px 2px 5px rgba(255,255,255,0.15)' }}>Turn: {turn}</h2>
                  <Timer onTimeUp={handleTimeUp} turn={turn} />
        </div>
        <div className="game-container">
          <div className="board-container">
            <Board table={table} dragging={false} validSquares={validSquares} isReady={isReady} setTable={setTable} setValidSquares={setValidSquares} />
          </div>
          <div className="board-container">
            <EnemyBoard target={target} setTarget={setTarget} merkleRoot={merkleRoot} attackedFields={attackedFields} />
          </div>
          <div className={target != null ? "attack-button" : "attack-button-locked"} onClick={target != null ? handleAttackClick : null}>ATTACK</div>
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