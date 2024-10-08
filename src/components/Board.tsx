import React, { useEffect } from 'react';
import '../styles/Board.css';

function Board({ table, dragging, validSquares, isReady, setTable, setValidSquares, SHIP_IMAGES, setSHIP_IMAGES, shipsPlaced, setShipsPlaced, fieldsEnemyAttacked }) {

	function handleOnClick(e) {
		if (e.target.className != "ship-image") return
		setShipsPlaced(shipsPlaced - 1)
		let length = 1
		let row = parseInt(parseInt(e.target.parentElement.id) / 10)
		let col = parseInt(parseInt(e.target.parentElement.id) % 10)
		for (let i = Math.max(0, row - 1); i < Math.min(10, row + 2); i++) {
			for (let j = Math.max(0, col - 1); j < Math.min(10, col + 2); j++) {
				validSquares[i][j] = true
			}
		}
		document.getElementById((row) * 10 + col).className = "board-square"
		let newTable = JSON.parse(JSON.stringify(table))
		newTable[row][col] = false
		if (row + 1 < 10 && table[row + 1][col]) {
			let counter = 1
			while (row + counter < 10 && table[row + counter][col]) {
				for (let i = Math.max(0, row + counter - 1); i < Math.min(10, row + counter + 2); i++) {
					for (let j = Math.max(0, col - 1); j < Math.min(10, col + 2); j++) {
						validSquares[i][j] = true
					}
				}
				newTable[row + counter][col] = false
				document.getElementById((row + counter) * 10 + col).className = "board-square"
				counter++;
				length++;
			}
		}
		if (row - 1 >= 0 && table[row - 1][col]) {
			let counter = 1
			while (row - counter >= 0 && table[row - counter][col]) {
				for (let i = Math.max(0, row - counter - 1); i < Math.min(10, row - counter + 2); i++) {
					for (let j = Math.max(0, col - 1); j < Math.min(10, col + 2); j++) {
						validSquares[i][j] = true
					}
				}
				newTable[row - counter][col] = false
				document.getElementById((row - counter) * 10 + col).className = "board-square"
				counter++;
				length++;
			}
		}
		if (col + 1 < 10 && table[row][col + 1]) {
			let counter = 1
			while (col + counter < 10 && table[row][col + counter]) {
				for (let i = Math.max(0, row - 1); i < Math.min(10, row + 2); i++) {
					for (let j = Math.max(0, col + counter - 1); j < Math.min(10, col + counter + 2); j++) {
						validSquares[i][j] = true
					}
				}
				newTable[row][col + counter] = false
				document.getElementById((row) * 10 + col + counter).className = "board-square"
				counter++;
				length++;
			}
		}
		if (col - 1 >= 0 && table[row][col - 1]) {
			let counter = 1
			while (col - counter >= 0 && table[row][col - counter]) {
				for (let i = Math.max(0, row - 1); i < Math.min(10, row + 2); i++) {
					for (let j = Math.max(0, col - counter - 1); j < Math.min(10, col - counter + 2); j++) {
						validSquares[i][j] = true
					}
				}
				newTable[row][col - counter] = false
				document.getElementById((row) * 10 + col - counter).className = "board-square"
				counter++;
				length++;
			}
		}

		setTable(newTable)
		let newSquares = JSON.parse(JSON.stringify(validSquares))
		console.log(newTable)
		for (let r = 0; r < 10; r++) {
			for (let c = 0; c < 10; c++) {
				if (newTable[r][c]) {
					for (let i = Math.max(0, r - 1); i < Math.min(10, r + 2); i++) {
						for (let j = Math.max(0, c - 1); j < Math.min(10, c + 2); j++) {
							newSquares[i][j] = false
						}
					}
				}
			}
		}
		setValidSquares(newSquares)
		let shipInfoArray = ['/images/ship.png', length, `ship${length}`]
		console.log(JSON.stringify(SHIP_IMAGES, null, 2))
		if (length == 3) {
			shipInfoArray[2] = "ship3-1"
			for (const ship of SHIP_IMAGES) {
				if (ship[2] == "ship3-1") {
					shipInfoArray[2] = "ship3-2"
				}
				else if (ship[2] == "ship3-2") {
					shipInfoArray[2] = "ship3-1"
				}
			}
		}
		let foundShip = false
		for (let i = 0; i < SHIP_IMAGES.length; i++) {
			if (SHIP_IMAGES[i][1] <= length) {
				let newShipImages = JSON.parse(JSON.stringify(SHIP_IMAGES))
				newShipImages.splice(i, 0, shipInfoArray)
				setSHIP_IMAGES(newShipImages)
				foundShip = true
				break
			}
		}
		if (!foundShip) {
			let newShipImages = JSON.parse(JSON.stringify(SHIP_IMAGES))
			newShipImages.push(shipInfoArray)
			setSHIP_IMAGES(newShipImages)
		}
	}

	const getClassName = (rowIndex,colIndex) => {
		if (table[rowIndex][colIndex]) {
			return "board-square-placed";
		} else if (dragging) {
			if (validSquares[rowIndex][colIndex]) {
				return "board-square-dragging";
			} else {
				return "board-square-invalid";
			}
		} else {
			return "board-square";
		}
	};

	
	const rows = Array.from({ length: 10 }, (_, rowIndex) =>
		Array.from({ length: 10 }, (_, colIndex) => (
			<div
				key={`${rowIndex}-${colIndex}`}
				className={getClassName(rowIndex, colIndex)}
				id={rowIndex * 10 + colIndex}
				onClick={!isReady ? handleOnClick : null}
			>
				{table[rowIndex][colIndex] ? (
					<img src={fieldsEnemyAttacked[rowIndex][colIndex] ? "/images/ship_killed.png" : "/images/ship.png"} alt="Ship" className="ship-image" />
				) : fieldsEnemyAttacked[rowIndex][colIndex] ? <img src="/images/ship_missed.png" alt="" className="ship-image"/> : null}
			</div>
		))
	);

	return <div className="board">{rows}</div>;
}

export default Board;