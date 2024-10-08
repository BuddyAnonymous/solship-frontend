import React, { useState, useEffect } from 'react';
import '../styles/EnemyBoard.css';
import { MerkleNode } from '../merkleTree/merkleTree';

function EnemyBoard({ target, setTarget, attackedFields, enemyShips }: { target: any; setTarget: any; attackedFields: number[]; enemyShips: boolean[][]}) {

    function handleOnClick(e: any) {
        for (let i = 0; i < 100; i++) {
            const element = document.getElementById(i + "-enemy");
            if (element && element.className != "enemy-board-square-attacked") {
                element.className = "enemy-board-square";
            }
        }
        if (e.target.className != "enemy-board-square-attacked" && e.target.className != "hit-ship") {
            setTarget(e.target.id)
            e.target.className = "enemy-square-clicked"
        }
    }
    const rows = Array.from({ length: 10 }, (_, rowIndex) =>
        Array.from({ length: 10 }, (_, colIndex) => (
            <div
                key={`${rowIndex}-${colIndex}-enemy`}
                className={attackedFields.includes(rowIndex * 10 + colIndex) ? "enemy-board-square-attacked" : "enemy-board-square"}
                id={`${rowIndex * 10 + colIndex}-enemy`}
                onClick={handleOnClick}
            >
                {enemyShips[rowIndex][colIndex] ? <img src="../../public/images/ship_killed.png" alt="" className='hit-ship'/> : attackedFields.includes(rowIndex*10 + colIndex) ? <img src="../../public/images/ship_missed.png" alt="" className='hit-ship'/> : null}
            </div>
        ))
    );

    return <div className="board">{rows}</div>;
}

export default EnemyBoard;