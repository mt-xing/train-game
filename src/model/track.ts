import {
	carGap, carLength, platformWidth, trainAccelerateTime, trainStallTime
} from '../consts/balanceConsts';
import { boardingPosWidth } from '../consts/visualConsts';
import { assertUnreachable } from '../utils';
import { BoardingPos, BoardingPosType } from './boardingPos';
import Train, { TrainConfig } from './train';

const boardingPosPriority: Record<BoardingPosType, number> = {
	local: 0,
	rapid: 1,
	express: 2,
	'ltd exp': 3,
	airport: 4,
};

export default class Track {
	/** Remaining trains in backwards order; next train is last item */
	private trains: TrainConfig[];

	/** Train in station */
	private stationTrain: {
		state: 'none', lastTrainLeft: number
	} | {
		state: 'arriving' | 'idle' | 'departing', train: Train, timeSinceStart: number
	};

	/** Timestamp of last processed step */
	private time: number;

	/** Time gap between trains */
	private timeGap: number;

	/** Time to wait before first train */
	private timeInitial: number;

	/** List of all boarding positions, first by car, then door, then the list of queues */
	private boardingPositions: BoardingPos[][][];

	/** True === -x train travel (low y end of platform) */
	private dir: boolean;

	constructor(initial: number, gap: number, trains: TrainConfig[], dir: boolean) {
		this.trains = trains.map((_, i, a) => a[a.length - i - 1]);
		this.stationTrain = { state: 'none', lastTrainLeft: 0 };
		this.timeGap = gap;
		this.timeInitial = initial;
		this.time = 0;
		this.dir = dir;
		if (gap < trainStallTime + 2 * trainAccelerateTime) {
			throw new Error('Train gap too small');
		}

		// Compute trains
		const setup = trains.reduce((a, x) => ({
			maxCars: Math.max(a.maxCars, x.cars),
			maxDoors: Math.max(a.maxDoors, x.doors),
			carLengths: a.carLengths.add(x.cars),
			doorNums: a.doorNums.add(x.doors),
			trainTypes: a.trainTypes.add(x.airport ? 'airport' : x.type),
		}), {
			maxCars: 0,
			maxDoors: 0,
			carLengths: new Set<number>(),
			doorNums: new Set<number>(),
			trainTypes: new Set<BoardingPosType>(),
		});

		// Hard coding in 5 doors for 3 + 4 for nicer symmetry
		if (setup.maxDoors < 5 && setup.doorNums.has(3) && setup.doorNums.has(4)) {
			setup.maxDoors = 5;
		}

		const carArr = Array(setup.maxCars).fill(undefined);
		const doorArr = Array(setup.maxDoors).fill(undefined);
		const typeArr = Array.from(setup.trainTypes)
			.sort((a, b) => boardingPosPriority[a] - boardingPosPriority[b]);

		this.boardingPositions = carArr.map((_a, carIndex) => doorArr.map((_b, doorIndex) => {
			const ps: BoardingPos[] = [];

			const doors = computeDoorsForPos(doorIndex, setup.doorNums, setup.maxDoors);
			const cars: number[] = [];

			setup.carLengths.forEach((carCandidate) => {
				const startInc = firstCarStoppingPos(carCandidate, setup.maxCars);
				const endExc = startInc + carCandidate;
				if (carIndex >= startInc && carIndex < endExc) {
					cars.push(carCandidate);
				}
			});

			typeArr.forEach((type, i) => {
				const xOffsetFromTrainFront = (carGap / 2)
					+ carIndex * (carLength + carGap)
					+ doorIndex * Math.floor(carLength / setup.maxDoors)
					+ (i + 1) * boardingPosWidth;
				ps.push(new BoardingPos(type, doors, cars, [
					dir
						? xOffsetFromTrainFront
						: (setup.maxCars * (carLength + carGap)) - xOffsetFromTrainFront,
					dir ? 0 : platformWidth
				], dir));
			});
			return ps;
		}));
	}

	step(newTime: number) {
		if (this.stationTrain.state === 'none') {
			this.checkTrainStartArriving(newTime);
		} else {
			const timeInState = this.stationTrain.timeSinceStart + (newTime - this.time);
			switch (this.stationTrain.state) {
			case 'arriving':
				if (timeInState >= trainAccelerateTime) {
					this.stationTrain.state = 'idle';
					this.stationTrain.timeSinceStart = timeInState - trainAccelerateTime;
				}
				break;
			case 'idle':
				if (timeInState >= trainStallTime) {
					this.stationTrain.state = 'departing';
					this.stationTrain.timeSinceStart = timeInState - trainStallTime;
				}
				break;
			case 'departing':
				if (timeInState >= trainStallTime) {
					this.stationTrain = { state: 'none', lastTrainLeft: newTime - (timeInState - trainStallTime) };
				}
				break;
			default: assertUnreachable(this.stationTrain);
			}
		}

		this.time = newTime;
	}

	private popNextTrain() {
		const train = this.trains.pop();
		if (train === undefined) {
			throw new Error('Out of trains to pop');
		}
		return new Train(train);
	}

	private checkTrainStartArriving(newTime: number) {
		if (this.stationTrain.state !== 'none') { throw new Error('Invalid train arrive'); }

		if (this.time < this.timeInitial) {
			// First train hasn't come in yet
			if (newTime >= this.timeInitial) {
				// Train coming
				this.stationTrain = {
					state: 'arriving',
					train: this.popNextTrain(),
					timeSinceStart: newTime - this.timeInitial
				};
			}
		} else {
			// Empty between trains
			const trainArriveTime = this.stationTrain.lastTrainLeft + this.timeGap;
			if (newTime >= trainArriveTime) {
				this.stationTrain = {
					state: 'arriving',
					train: this.popNextTrain(),
					timeSinceStart: newTime - trainArriveTime
				};
			}
		}
	}
}

// Helper functions below exported only for testing

/** Returns ZERO-INDEXED stopping position of first car */
export function firstCarStoppingPos(trainLength: number, trackLength: number) {
	if (trainLength > trackLength) { throw new Error('Train does not fit'); }
	return Math.floor((trackLength - trainLength) / 2);
}

export function computeDoorsForPos(doorIndex: number, doorNums: Set<number>, maxDoors: number) {
	const doors: number[] = [];

	doorNums.forEach((doorCandidate) => {
		if (doorIndex === 0 || doorCandidate === maxDoors) {
			doors.push(doorCandidate);
			return;
		}
		if (doorCandidate <= 1) { return; }
		if (maxDoors % 2 !== 0 && doorIndex * 2 + 1 === maxDoors) {
			// Mid door on a train with odd doors
			if (doorCandidate % 2 !== 0) {
				doors.push(doorCandidate);
			}
			return;
		}
		const mid = Math.floor(maxDoors / 2) - 1;
		if (maxDoors % 2 === 0 && doorCandidate % 2 !== 0 && doorIndex === mid) {
			// Even car, odd center door
			doors.push(doorCandidate);
			return;
		}
		const equivalentDoor = doorIndex > mid ? (maxDoors - doorIndex - 1) : doorIndex;
		if (equivalentDoor === 0) {
			doors.push(doorCandidate);
			return;
		}
		const numDoorsOpen = maxDoors % 2 === 0 && doorCandidate % 2 !== 0 ? mid - 1 : mid;
		const numDoorsLeft = Math.floor(doorCandidate / 2) - 1;
		if (numDoorsLeft <= 0) { return; }
		const g = numDoorsOpen / numDoorsLeft;
		for (let i = g; i <= numDoorsOpen; i += g) {
			if (Math.ceil(i) === equivalentDoor) {
				doors.push(doorCandidate);
				return;
			}
		}
	});

	return doors;
}
