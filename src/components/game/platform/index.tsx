import React from 'react';
import './index.css';
import { PaxBase } from '../../../model/pax';

type PlatformProps = {
	startPx: number;
	pax: PaxBase[];
};

function Platform(props: PlatformProps) {
	const { pax, startPx } = props;

	return (
		<section className='platform'>
			{pax.map((p) => (p.position ? <div className='player' key={p.id} style={{
				top: `${p.position[1]}px`,
				left: `${p.position[0] - startPx}px`,
			}} /> : null))}
		</section>
	);
}

export default Platform;
