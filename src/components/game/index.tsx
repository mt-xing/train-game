import React from 'react';
import Track from './track';
import Platform from './platform';
import './index.css';

function Game() {
	return (
		<main className="game">
			<Track flip={true} trainState={'idle'} trainDoors={3} trainCars={6} maxDoors={5} maxCars={6} />
			<Platform platformState={true} />
			<Track flip={false} trainState={'idle'} trainDoors={3} trainCars={6} maxDoors={5} maxCars={6} />
		</main>
	);
}

export default Game;
