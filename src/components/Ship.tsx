import React, { useState, useEffect, useRef } from 'react';
import '../styles/Ship.css';

function Ship({ id, src, alt, style, table, setTable, sqWidth, setGlobalDrag, validSquares, setValidSquares, SHIP_IMAGES, setSHIP_IMAGES, shipsPlaced, setShipsPlaced }) {
	const [isDragging, setIsDragging] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [initialPosition, setInitialPosition] = useState({ top: 0, left: 0 });
	const elementDrag = useRef(false);
	const draggedElementRef = useRef(null);

	useEffect(() => {
		// Add keydown event listener when component mounts
		window.addEventListener('keydown', handleKeyDown);

		// Remove keydown event listener on cleanup
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, []);

	useEffect(() => {
		if (isDragging) {
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);
		} else {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		}

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isDragging]);

	const handleMouseDown = (e) => {
		setIsDragging(true);
		setGlobalDrag(true);
		setInitialPosition({ top: position.top, left: position.left });
		setPosition({ top: e.clientY - 25, left: e.clientX - 25 });
		elementDrag.current = true;
		draggedElementRef.current = e.target;
	};

	const handleMouseMove = (e) => {
		if (isDragging) {
			setPosition({
				top: e.clientY - draggedElementRef.current.offsetHeight / 2,
				left: e.clientX - draggedElementRef.current.offsetWidth / 2,
			});
		}
	};

	const handleMouseUp = (event) => {

		setGlobalDrag(false);
		setIsDragging(false);
		elementDrag.current = false;
		let found = false;
		document.elementsFromPoint(event.clientX, event.clientY).forEach((element) => {
			if (element.className.includes("board-square") && validSquares[parseInt(element.id / 10)][parseInt(element.id % 10)]) {
				let squareLength = sqWidth
				let width = parseInt(draggedElementRef.current.parentElement.style.width.slice(0, -2))
				let height = parseInt(draggedElementRef.current.parentElement.style.height.slice(0, -2))
				if (width > height) {
					if (element.id % 10 <= 10 - squareLength) {
						let validPlacement = true;
						for (let i = 0; i < squareLength; i++) {
							if (!validSquares[parseInt(element.id / 10)][parseInt(element.id % 10) + i]) {
								validPlacement = false;
							}
						}
						if (validPlacement) {
							for (let i = 0; i < squareLength; i++) {
								found = true;
								setTable(prevTable => {
									const newTable = prevTable.map(row => [...row]);
									newTable[parseInt(element.id / 10)][parseInt(element.id % 10) + i] = true;
									return newTable;
								});
								setValidSquares(prevTable => {
									const newTable = prevTable.map(row => [...row]);
									for (let i = Math.max(0, parseInt(element.id / 10) - 1); i < Math.min(10, parseInt(element.id / 10) + 2); i++) {
										for (let j = Math.max(0, parseInt(element.id % 10) - 1); j < Math.min(10, parseInt(element.id % 10) + squareLength + 1); j++) {
											newTable[i][j] = false;
										}
									}
									return newTable;
								});
							}
						}
					}
				}
				else {
					if (parseInt(element.id / 10) <= 10 - squareLength) {
						let validPlacement = true;
						for (let i = 0; i < squareLength; i++) {
							if (!validSquares[parseInt(element.id / 10) + i][parseInt(element.id % 10)]) {
								validPlacement = false;
							}
						}
						if (validPlacement) {
							for (let i = 0; i < squareLength; i++) {
								found = true;
								setTable(prevTable => {
									const newTable = prevTable.map(row => [...row]);
									newTable[parseInt(element.id / 10) + i][parseInt(element.id % 10)] = true;
									return newTable;
								});

								setValidSquares(prevTable => {
									const newTable = prevTable.map(row => [...row]);
									for (let i = Math.max(0, parseInt(element.id / 10) - 1); i < Math.min(10, parseInt(element.id / 10) + squareLength + 1); i++) {
										for (let j = Math.max(0, parseInt(element.id % 10) - 1); j < Math.min(10, parseInt(element.id % 10) + 2); j++) {
											newTable[i][j] = false;
										}
									}
									return newTable;
								});
							}
						}
					}
				}
			}
		});
		if (!found) {
			if (draggedElementRef.current !== null) {
				setPosition(initialPosition); // Reset to initial position
				let width = parseInt(draggedElementRef.current.parentElement.style.width.slice(0, -2))
				let height = parseInt(draggedElementRef.current.parentElement.style.height.slice(0, -2))
				if (height > width) {
					draggedElementRef.current.parentElement.style.width = `${height}px`
					draggedElementRef.current.parentElement.style.height = `${width}px`
					draggedElementRef.current.parentElement.className = "ship"
				}
			}
		} else {
			const draggedElement = document.elementFromPoint(position.left, position.top);
			if (draggedElement) {
				setSHIP_IMAGES(prevTable => {
					let newTable = prevTable.map(row => [...row]);
					newTable = newTable.filter(item => !item.includes(draggedElement.parentElement.id));
					return newTable;
				}
				);
				setShipsPlaced(shipsPlaced + 1);
			}
		}
		draggedElementRef.current = null;
		// Remove the keydown event listener when dragging stops
		window.removeEventListener('keydown', handleKeyDown);
	};

	const handleKeyDown = (e) => {
		if (e.key.toLowerCase() === 'r' && elementDrag.current === true) {
			if (draggedElementRef !== null) {
				if (draggedElementRef.current.parentElement.className !== "vert") {
					let width = parseInt(draggedElementRef.current.parentElement.style.width.slice(0, -2))
					let height = parseInt(draggedElementRef.current.parentElement.style.height.slice(0, -2))
					draggedElementRef.current.parentElement.style.width = `${height}px`
					draggedElementRef.current.parentElement.style.height = `${width}px`
					draggedElementRef.current.parentElement.className = "vert"
				}
				else {
					let width = parseInt(draggedElementRef.current.parentElement.style.width.slice(0, -2))
					let height = parseInt(draggedElementRef.current.parentElement.style.height.slice(0, -2))
					draggedElementRef.current.parentElement.style.width = `${height}px`
					draggedElementRef.current.parentElement.style.height = `${width}px`
					draggedElementRef.current.parentElement.className = "ship"
				}
			}
		}
	};

	return (
		<div
			id={id}
			className="ship"
			style={{
				...style,
				position: isDragging ? 'absolute' : 'relative',
				top: position.top,
				left: position.left,
				zIndex: isDragging ? 1000 : 'auto',
			}}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
		>
			{Array.from({ length: sqWidth }).map((_, index) => (
				<img key={index} src={src} alt={alt} style={{}} />
			))}
		</div>
	);
}

export default Ship;
