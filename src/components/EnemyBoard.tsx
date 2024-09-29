import React, { useState, useEffect } from 'react';
import '../styles/EnemyBoard.css';
import { MerkleNode } from '../merkleTree/merkleTree';

function EnemyBoard({ target, setTarget, merkleRoot }: { target: any; setTarget: any; merkleRoot: MerkleNode }) {

    const [merkleProof, setMerkleProof] = useState<string[]>([])
    
    function handleOnClick(e) {
        for (let i = 0; i < 100; i++) {
            document.getElementById(i + "-enemy").className = "enemy-board-square"
        }
        setTarget(e.target.id)
        e.target.className = "enemy-square-clicked"
        let fieldIndex = parseInt(e.target.id.split("-")[0]) + 1
        let dirArray : number[] = []
        while(dirArray.length < 7){
            dirArray.unshift(fieldIndex % 2)
            fieldIndex = Math.ceil(fieldIndex / 2)
        }

        let currNode: MerkleNode = merkleRoot
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
        tempProof.push(merkleRoot.hash)
        setMerkleProof(tempProof)

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