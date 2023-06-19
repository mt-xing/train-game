import React, { useCallback } from 'react';
import './index.css';
import { Pax, PaxBase } from '../../../model/pax';
import { BoardingPos } from '../../../model/boardingPos';
import { Pos } from '../../../utils';

type PlatformProps = {
	startPx: number;
	pax: PaxBase[];
	pxPerAsu: number;
	boardingPos: [BoardingPos[], BoardingPos[]];
	setSelected: (p: Pax | null) => void;
	selectedPax: Pax | null;
	spawnPax: (p: Pax, pos: Pos) => void;
};

function Platform(props: PlatformProps) {
	const {
		pax, startPx, boardingPos, pxPerAsu, setSelected, selectedPax, spawnPax
	} = props;

	const queuePos = useCallback((dest: BoardingPos) => {
		if (selectedPax === null) { return; }
		const sp = selectedPax;
		if (!sp.isSpawned) {
			spawnPax(sp, dest.position);
		} else {
			sp.queueTarget(dest.position, () => {
				dest.enqueuePax(sp);
			});
		}

		setSelected(null);
	}, [selectedPax, setSelected, spawnPax]);

	return (
		<section className='platform'>
			{
				boardingPos[0].map((bp, i) => <div className="bp" key={i} style={{
					top: `${bp.position[1] * pxPerAsu}px`,
					left: `${bp.position[0] * pxPerAsu - startPx}px`,
				}} onClick={() => queuePos(bp)} />)
			}
			{pax.map((p) => (p.position ? <div className='player' key={p.id} style={{
				top: `${p.position[1] * pxPerAsu - 10}px`,
				left: `${p.position[0] * pxPerAsu - startPx - 10}px`,
				background: p === selectedPax ? 'red' : undefined,
			}} onClick={() => (p.isUserControllable() ? setSelected(p) : undefined)} /> : null))}
			{
				boardingPos[1].map((bp, i) => <div className="bp" key={i} style={{
					top: `${bp.position[1] * pxPerAsu - 20}px`,
					left: `${bp.position[0] * pxPerAsu - startPx}px`,
				}} onClick={() => queuePos(bp)} />)
			}
		</section>
	);
}

export default Platform;
