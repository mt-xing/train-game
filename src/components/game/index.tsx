import React from 'react';
import Track from './track';
import Platform from './platform';

function Game() {
	return (
		<main>
			<h1>Hello World; GAME GOES HERE</h1>
			<Track flip={true} />
			<Platform platformState={true} />
			<Track flip={false} />
		</main>
	);
}

export default Game;
