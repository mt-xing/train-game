import React, { useEffect, useState } from 'react';
import Track from './track';
import Platform from './platform';
import './index.css';
import { carGap, carLength, platformWidth as pWidthAsu } from '../../consts/balanceConsts';
import { Pos, getScrollFrac } from '../../utils';
import TrainGame from '../../model/game';
import { testLevel } from '../../levels';
import Queue from './queue';
import { Pax } from '../../model/pax';

const platformSize = [6 * (carLength + carGap), 100] as Pos;

const game = new TrainGame(testLevel);

function Game() {
	const [scroll, setScroll] = useState(0);
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const [windowHeight, setWindowHeight] = useState(window.innerHeight);
	const [_iteration, setIteration] = useState(0);

	useEffect(() => {
		let going = true;

		const ev1 = () => setScroll(getScrollFrac());
		window.addEventListener('scroll', ev1);
		const ev2 = () => {
			setWindowWidth(window.innerWidth);
			setWindowHeight(window.innerHeight);
			ev1();
		};
		window.addEventListener('resize', ev2);

		let time = performance.now();
		const gameLoop = (t: number) => {
			game.step(t - time);
			time = t;
			setIteration((i) => i + 1);
			if (going) {
				window.requestAnimationFrame(gameLoop);
			}
		};
		gameLoop(performance.now());

		return () => {
			window.removeEventListener('scroll', ev1);
			window.removeEventListener('resize', ev2);
			going = false;
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

	const { state } = game;
	const [selectedPax, setSelectedPax] = useState<null | Pax>(null);

	return (
		<main className="game">
			<Track
				flip={true}
				trackState={state.tracks[0]}
				startPx={startPx}
			/>
			<Platform
				pax={state.platform.pax}
				startPx={startPx}
				pxPerAsu={pxPerAsu}
				boardingPos={game.boardingPos}
				selectedPax={selectedPax}
				setSelected={setSelectedPax}
				spawnPax={game.sendPaxToLoc}
			/>
			<Track
				flip={false}
				trackState={state.tracks[1]}
				startPx={startPx}
			/>
			<Queue pax={state.paxQueue} setSelected={setSelectedPax} selectedPax={selectedPax} />
		</main>
	);
}

export default Game;
