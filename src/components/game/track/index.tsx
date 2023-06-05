import React, { useEffect, useMemo } from 'react';
import { assertUnreachable } from '../../../utils';
import './index.css';
import { computeDoorsForPos, firstCarStoppingPos } from '../../../model/track';
import { TrackState } from '../../../model/stateTypes';

type TrackProps = {
	/** Flipped = left or up */
	flip: boolean;
	trackState: TrackState;
	startPx: number;
};

const doorWidth = 70;

function Track(props: TrackProps) {
	const {
		flip, trackState, startPx,
	} = props;
	const {
		trainState, trainDoors, trainCars, boardingPos,
	} = trackState;

	const maxCars = boardingPos.length;
	const maxDoors = boardingPos[0].length;

	useEffect(() => {
		if (trainDoors > maxDoors || trainCars > maxCars) {
			throw new Error('Invalid train config for track');
		}
	}, [trainDoors, trainCars, maxDoors, maxCars]);

	const trainClass = useMemo(() => {
		switch (trainState) {
		case 'none':
			return 'pre';
		case 'arriving':
		case 'idle':
			return '';
		case 'departing':
			return 'departing';
		default: return assertUnreachable(trainState);
		}
	}, [trainState]);

	const trainDoorOffsets = useMemo(() => {
		const o = [];

		for (let ii = 0; ii < maxDoors; ii++) {
			const i = flip ? ii : (maxDoors - 1 - ii);
			const percentagePos = i * (100 / (maxDoors - 1));
			const offsetPx = doorWidth * (percentagePos / 100);
			o.push(`calc(${percentagePos}% - ${offsetPx}px)`);
		}

		return o;
	}, [maxDoors, flip]);

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
		<section className={`track ${flip ? 'flip' : ''}`} style={{ transform: `translateX(${-1 * startPx}px)` }} >
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
