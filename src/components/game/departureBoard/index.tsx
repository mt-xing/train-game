import React from 'react';
import './index.css';
import { TrainConfig } from '../../../model/train';

type QueueProps = {
	departures: [TrainConfig[], TrainConfig[]],
};

export default function DepartureBoard(props: QueueProps) {
	const depList = props.departures.flat().sort((a, b) => a.uiTime - b.uiTime);
	const minTime = depList.length ? depList[0].uiTime : 0;

	return <section className='depBoard'>
		<h2>Departures</h2>
		<ul>
			{
				depList.map((train) => <li key={`${train.uiTime}-${train.destination}`}>
					{train.uiTime - minTime > 0 ? `+${train.uiTime - minTime}` : 'next'}{' '}
					{train.type} {train.destination}{' '}
					{train.cars}/{train.destination}{' '}
					{JSON.stringify(train.blue)}{' '}
					{JSON.stringify(train.reserved)}
				</li>)
			}
		</ul>
	</section>;
}
