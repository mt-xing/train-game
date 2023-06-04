import React, { useEffect, useMemo } from 'react';
import { assertUnreachable } from '../../../utils';
import './index.css';
import { computeDoorsForPos, firstCarStoppingPos } from '../../../model/track';

type TrackProps = {
	/** Flipped = left or up */
	flip: boolean;
	trainState: 'arriving' | 'idle' | 'departing' | 'none';
	trainDoors: number;
	trainCars: number;
	maxDoors: number;
	maxCars: number;
};

const doorWidth = 70;

function Track(props: TrackProps) {
	const {
		flip, trainState, trainDoors, trainCars, maxDoors, maxCars,
	} = props;

	useEffect(() => {
		if (trainDoors > maxDoors || trainCars > maxCars) {
			throw new Error('Invalid train config for track');
		}
	}, [trainDoors, trainCars, maxDoors, maxCars]);

	const trainClass = useMemo(() => {
		switch (trainState) {
		case 'arriving':
		case 'none':
			return 'arriving';
		case 'idle':
			return '';
		case 'departing':
			return 'departing';
		default: return assertUnreachable(trainState);
		}
	}, [trainState]);

	const trainDoorOffsets = useMemo(() => {
		const o = ['0'];

		for (let i = 1; i < maxDoors; i++) {
			const percentagePos = i * (100 / (maxDoors - 1));
			const offsetPx = doorWidth * (percentagePos / 100);
			o.push(`calc(${percentagePos}% - ${offsetPx}px)`);
		}

		return o;
	}, [maxDoors]);

	const computedDoorOffsets = useMemo(() => Array.from(Array(maxDoors)).map((_, i) => {
		const doorsAtI = computeDoorsForPos(i, new Set([maxDoors, trainDoors]), maxDoors);
		if (doorsAtI.indexOf(trainDoors) !== -1) {
			return trainDoorOffsets[i];
		} else {
			return '';
		}
	}).filter((x) => x !== ''), [maxDoors, trainDoorOffsets, trainDoors]);

	const allCarArr: unknown[] = useMemo(
		() => Array.from(new Array(maxCars)) as unknown[], [maxCars]
	);
	const trainDoorArr: unknown[] = useMemo(
		() => Array.from(new Array(trainDoors)) as unknown[], [trainDoors]
	);

	const firstCarIndex = useMemo(
		() => firstCarStoppingPos(trainCars, maxCars), [trainCars, maxCars]
	);

	return (
		<section className={`track ${flip ? 'flip' : ''}`}>
			<div className={`train ${trainClass}`}>
				{
					allCarArr.map((_, i) => <div className="car" key={i} style={{
						opacity: (i < firstCarIndex || i >= firstCarIndex + trainCars) ? 0 : 1
					}}>{
							trainDoorArr.map((_d, d) => (
								<div
									className="door"
									key={d}
									style={{
										left: computedDoorOffsets[d],
										top: flip ? undefined : 0,
										width: `${doorWidth}px`
									}}
								/>
							))
						}</div>)
				}
			</div>
		</section>
	);
}

export default Track;
