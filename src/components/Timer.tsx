import React, { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const Timer = ({ onTimeUp, turn, running }) => {
	const [timeLeft, setTimeLeft] = useState(30); // Time in seconds
	const [elapsedTime, setElapsedTime] = useState(0); // Time passed in ms

	useEffect(() => {
		// Reset the timer whenever the turn changes
		setTimeLeft(30);
		setElapsedTime(0);
	}, [turn]);

	useEffect(() => {
		if (!running) return; // Do nothing if the timer is not running

		if (elapsedTime >= 35200) { // 30 seconds = 30000 milliseconds
			onTimeUp(); // Trigger callback when time's up
			return;
		}

		// Set up an interval to count every 100 milliseconds
		const intervalId = setInterval(() => {
			setElapsedTime((prevElapsedTime) => prevElapsedTime + 100);
		}, 100);

		// Cleanup interval on component unmount or when elapsedTime changes
		return () => clearInterval(intervalId);
	}, [elapsedTime, onTimeUp, running]);

	// Calculate the remaining time and percentage
	const secondsLeft = Math.max(0, (30000 - elapsedTime) / 1000).toFixed(1); // Display as seconds with 1 decimal
	const percentage = 100 - (elapsedTime / 30000) * 100; // Reverse the percentage to deplete from full

	return (
		<div style={{ width: '150px', margin: '20px auto' }}>
			<CircularProgressbar
				value={percentage}
				text={`${secondsLeft}s`}
				styles={buildStyles({
					textSize: '16px',
					pathColor: parseInt(secondsLeft) > 9 ? '#00d084' : parseInt(secondsLeft) > 4 ? 'orange' : '#ff4d4d', // Change color based on remaining time
					textColor: 'orange',
					trailColor: '#d6d6d6',
				})}
			/>
		</div>
	);
};

export default Timer;