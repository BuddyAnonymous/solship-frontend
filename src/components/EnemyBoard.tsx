import React, { useState, useEffect } from 'react';
import '../styles/EnemyBoard.css';
import { MerkleNode } from '../merkleTree/merkleTree';

function EnemyBoard({ target, setTarget}: { target: any; setTarget: any}) {
    
    function handleOnClick(e: any) {
        for (let i = 0; i < 100; i++) {
            document.getElementById(i + "-enemy").className = "enemy-board-square"
        }
        setTarget(e.target.id)
        e.target.className = "enemy-square-clicked"
    }
    const rows = Array.from({ length: 10 }, (_, rowIndex) =>
        Array.from({ length: 10 }, (_, colIndex) => (
            <div
                key={`${rowIndex}-${colIndex}-enemy`}
                className="enemy-board-square"
                id={`${rowIndex * 10 + colIndex}-enemy`}
                onClick= {handleOnClick}
            >
            </div>
        ))
    );

    return <div className="board">{rows}</div>;
}

export default EnemyBoard;