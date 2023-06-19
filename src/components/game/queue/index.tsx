import React, { useCallback } from 'react';
import { Pax } from '../../../model/pax';
import './index.css';

type QueueProps = {
	pax: Pax[],
	setSelected: (p: Pax | null) => void,
	selectedPax: Pax | null;
};

type QueuePaxProps = {
	pax: Pax,
	setSelected: (p: Pax | null) => void,
	selectedPax: Pax | null;
};

function QueuePax(props: QueuePaxProps) {
	const { setSelected, pax, selectedPax } = props;
	const c = useCallback(() => setSelected(pax), [setSelected, pax]);
	return <div className='pax' onClick={c} style={{
		background: selectedPax?.id === pax.id ? 'red' : undefined
	}} />;
}

export default function Queue(props: QueueProps) {
	return <section className='queue'>{
		props.pax.map((pax) => <QueuePax
			key={pax.id}
			pax={pax}
			setSelected={props.setSelected}
			selectedPax={props.selectedPax}
		/>)
	}</section>;
}
