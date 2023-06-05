import React, { useEffect, useState } from 'react';
import Track from './track';
import Platform from './platform';
import './index.css';
import { Pax } from '../../model/pax';
import { carGap, carLength, platformWidth as pWidthAsu } from '../../consts/balanceConsts';
import { Pos, getScrollFrac } from '../../utils';
import TrainGame from '../../model/game';
import { testLevel } from '../../levels';

const p = new Pax({
	destination: 'a', timing: [], blue: false, reservation: false, women: false, handicap: false
});
p.spawn([500, 50]);

const platformSize = [6 * (carLength + carGap), 100] as Pos;

const game = new TrainGame(testLevel);
game.step(20000);

function Game() {
	const [scroll, setScroll] = useState(0);
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const [windowHeight, setWindowHeight] = useState(window.innerHeight);
	useEffect(() => {
		const ev1 = () => setScroll(getScrollFrac());
		window.addEventListener('scroll', ev1);
		const ev2 = () => {
			setWindowWidth(window.innerWidth);
			setWindowHeight(window.innerHeight);
			ev1();
		};
		window.addEventListener('resize', ev2);
		return () => {
			window.removeEventListener('scroll', ev1);
			window.removeEventListener('resize', ev2);
		};
	}, []);

	const pxPerAsu = (windowHeight * 0.6) / pWidthAsu;

	const platformWidthAsu = platformSize[0];
	const platformWidthPx = platformWidthAsu * pxPerAsu;

	const scrollNeeded = platformWidthPx - windowWidth;
	const startPx = scrollNeeded > 0 ? scrollNeeded * scroll : 0;

	useEffect(() => {
		const { body } = document;
		if (!body) { return; }
		if (scrollNeeded <= 0) {
			body.style.height = '';
		} else {
			body.style.height = `${100 + (scrollNeeded / 20)}vh`;
		}

		return () => { body.style.height = ''; };
	}, [scrollNeeded]);

	return (
		<main className="game">
			<Track
				flip={true}
				trackState={game.state.tracks[0]}
				startPx={startPx}
			/>
			<Platform pax={[p]} startPx={startPx} pxPerAsu={pxPerAsu} boardingPos={game.boardingPos} />
			<Track
				flip={false}
				trackState={game.state.tracks[1]}
				startPx={startPx}
			/>
		</main>
	);
}

export default Game;
