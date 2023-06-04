import React, { useEffect, useState } from 'react';
import Track from './track';
import Platform from './platform';
import './index.css';
import { Pax } from '../../model/pax';
import { carGap, carLength, platformWidth as pWidthAsu } from '../../consts/balanceConsts';
import { Pos, getScrollFrac } from '../../utils';

const p = new Pax({
	destination: 'a', timing: [], blue: false, reservation: false, women: false, handicap: false
});
p.spawn([500, 50]);

const platformSize = [6 * (carLength + carGap), 100] as Pos;

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
			body.style.height = `${100 + (scrollNeeded / 10)}vh`;
		}

		return () => { body.style.height = ''; };
	}, [scrollNeeded]);

	return (
		<main className="game">
			<Track flip={true} trainState={'idle'} trainDoors={5} trainCars={4} maxDoors={5} maxCars={6} startPx={startPx} />
			<Platform pax={[p]} startPx={startPx} />
			<Track flip={false} trainState={'idle'} trainDoors={3} trainCars={6} maxDoors={5} maxCars={6} startPx={startPx} />
		</main>
	);
}

export default Game;
