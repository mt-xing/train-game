import React, { useCallback, useState } from 'react';
import './index.css';
import { Pax, PaxBase } from '../../../model/pax';
import { BoardingPos } from '../../../model/boardingPos';

type PlatformProps = {
	startPx: number;
	pax: PaxBase[];
	pxPerAsu: number;
	boardingPos: [BoardingPos[], BoardingPos[]];
};

function Platform(props: PlatformProps) {
	const {
		pax, startPx, boardingPos, pxPerAsu
	} = props;

	const [selectedPlayer, setSelectedPlayer] = useState<null | PaxBase>(null);
	const queuePos = useCallback((dest: BoardingPos) => {
		if (selectedPlayer === null) { return; }
		const sp = selectedPlayer;
		sp.queueTarget(dest.position, () => {
			dest.enqueuePax(sp as Pax);
		});
		setSelectedPlayer(null);
	}, [selectedPlayer]);

	return (
		<section className='platform'>
			{
				boardingPos[0].map((bp, i) => <div className="bp" key={i} style={{
					top: `${bp.position[1] * pxPerAsu}px`,
					left: `${bp.position[0] * pxPerAsu - startPx}px`,
				}} onClick={() => queuePos(bp)} />)
			}
			{pax.map((p) => (p.position ? <div className='player' key={p.id} style={{
				top: `${p.position[1] * pxPerAsu}px`,
				left: `${p.position[0] * pxPerAsu - startPx}px`,
				background: p === selectedPlayer ? 'red' : undefined,
			}} onClick={() => (p.userControllable ? setSelectedPlayer(p) : undefined)} /> : null))}
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
