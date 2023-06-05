import {
	carGap, carLength, paxBoardTime, paxTotalDeboardTime,
	platformWidth, trainAccelerateTime, trainStallTime
} from '../consts/balanceConsts';
import { boardingPosWidth, paxDeboardTime } from '../consts/visualConsts';
import { BoardingResult, canBoard } from '../controller/boarding';
import { Pos, assertUnreachable } from '../utils';
import { BoardingPos, BoardingPosType } from './boardingPos';
import { Pax } from './pax';
import { TrackState } from './stateTypes';
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

	private boardingPosConfigCache: BoardingPosType[][][];

	/** True === -x train travel (low y end of platform) */
	private dir: boolean;

	private paxBoardingTrain: Set<Pax>;

	private spawnDeboardedPax: (pos: Pos) => void;

	private failedBoard: (pos: Pos, type: BoardingResult) => void;

	private trainDepart: (train: TrainConfig, depBoard: TrainConfig[]) => void;

	constructor(
		initial: number, gap: number, trains: TrainConfig[], dir: boolean,
		spawnDeboardedPax: ((pos: Pos) => void),
		failedBoard: ((pos: Pos, type: BoardingResult) => void),
		trainDepart: (train: TrainConfig, depBoard: TrainConfig[]) => void,
	) {
		this.trains = trains.map((_, i, a) => a[a.length - i - 1]);
		this.stationTrain = { state: 'none', lastTrainLeft: 0 };
		this.timeGap = gap;
		this.timeInitial = initial;
		this.time = performance.now();
		this.dir = dir;
		this.spawnDeboardedPax = spawnDeboardedPax;
		this.failedBoard = failedBoard;
		this.trainDepart = trainDepart;
		this.paxBoardingTrain = new Set();
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
				const xOffsetFromTrainFrontDoor = (carGap / 2)
					+ carIndex * (carLength + carGap)
					+ doorIndex * Math.floor(carLength / setup.maxDoors);
				const xOffsetFromTrainFrontPos = xOffsetFromTrainFrontDoor
					+ (i + 1) * boardingPosWidth;
				const y = dir ? 0 : platformWidth;
				ps.push(new BoardingPos(type, doors, cars, carIndex, [
					dir
						? xOffsetFromTrainFrontPos
						: (setup.maxCars * (carLength + carGap)) - xOffsetFromTrainFrontPos,
					y
				], dir, [
					dir
						? xOffsetFromTrainFrontDoor
						: (setup.maxCars * (carLength + carGap)) - xOffsetFromTrainFrontDoor,
					y
				]));
			});
			return ps;
		}));

		this.boardingPosConfigCache =	this.boardingPos.map(
			(car) => car.map((door) => door.map((x) => x.type))
		);
	}

	step(timeDelta: number) {
		this.boardingPositions.forEach((a) => a.forEach(
			(b) => b.forEach((c) => c.step(timeDelta))
		));

		const newTime = this.time + timeDelta;

		if (this.stationTrain.state === 'none') {
			this.checkTrainStartArriving(newTime);
		} else {
			const timeInState = this.stationTrain.timeSinceStart + timeDelta;
			switch (this.stationTrain.state) {
			case 'arriving':
				if (timeInState >= trainAccelerateTime) {
					this.stationTrain.state = 'idle';
					this.stationTrain.timeSinceStart = timeInState - trainAccelerateTime;
				} else {
					this.stationTrain.timeSinceStart += timeDelta;
				}
				break;
			case 'idle':
				if (timeInState >= trainStallTime) {
					// Train is leaving
					this.trainDepart(this.stationTrain.train.config, this.trains.slice().reverse());
					this.stationTrain.state = 'departing';
					this.stationTrain.timeSinceStart = timeInState - trainStallTime;
				} else {
					const { train } = this.stationTrain;
					const isDeboard = timeInState <= paxTotalDeboardTime;

					const timeGap = isDeboard ? paxDeboardTime : paxBoardTime;
					const action = isDeboard ? this.loopTrainBoardingPos.bind(this, (p) => {
						this.spawnDeboardedPax(p.associatedDoorPos);
					}) : this.stepBoardOnePax.bind(this, train.config);

					this.boardOrDeboard(
						this.stationTrain.timeSinceStart,
						timeInState,
						timeGap,
						action,
					);

					this.stationTrain.timeSinceStart += timeDelta;
				}
				break;
			case 'departing':
				if (timeInState >= trainStallTime) {
					this.stationTrain = { state: 'none', lastTrainLeft: newTime - (timeInState - trainStallTime) };
				} else {
					this.stationTrain.timeSinceStart += timeDelta;
				}
				break;
			default: assertUnreachable(this.stationTrain);
			}
		}

		this.time = newTime;
	}

	get state(): TrackState {
		if (this.stationTrain.state === 'none') {
			if (this.trains.length === 0) {
				return {
					trainState: this.stationTrain.state,
					trainCars: 0,
					trainDoors: 0,
					boardingPos: this.boardingPosConfigCache,
				};
			}
			const nextTrain = this.trains[this.trains.length - 1];
			return {
				trainState: this.stationTrain.state,
				trainCars: nextTrain.cars,
				trainDoors: nextTrain.doors,
				boardingPos: this.boardingPosConfigCache,
			};
		}
		return {
			trainState: this.stationTrain.state,
			trainCars: this.stationTrain.train.config.cars,
			trainDoors: this.stationTrain.train.config.doors,
			boardingPos: this.boardingPosConfigCache,
		};
	}

	private loopTrainBoardingPos(fn: (x: BoardingPos, i?: number) => void) {
		if (this.stationTrain.state !== 'idle') { throw new Error('Cannot loop over nonexistent train'); }
		const { train } = this.stationTrain;
		const startCarInc = firstCarStoppingPos(train.config.cars, this.boardingPositions.length);
		const endCarExc = startCarInc + train.config.cars;
		this.boardingPositions.forEach((a, carIndex) => {
			if (carIndex < startCarInc || carIndex >= endCarExc) { return; }
			a.forEach((b) => {
				b.forEach((p) => {
					if (
						p.hasDoor(train.config.doors)
						&& (p.type === train.config.type || (p.type === 'airport' && train.config.airport))
					) {
						fn(p);
					}
				});
			});
		});
	}

	forEachBoardingPos(fn: (x: BoardingPos) => void) {
		this.boardingPositions.forEach((a) => a.forEach((b) => b.forEach(fn)));
	}

	get allPaxPos() {
		return this.boardingPositions.map((a) => a.map((b) => b.map((c) => c.position)));
	}

	get boardingPos() { return this.boardingPositions; }

	private popNextTrain() {
		const train = this.trains.pop();
		if (train === undefined) {
			throw new Error('Out of trains to pop');
		}
		return new Train(train);
	}

	private checkTrainStartArriving(newTime: number) {
		if (this.stationTrain.state !== 'none') { throw new Error('Invalid train arrive'); }

		// TODO end level
		if (this.trains.length === 0) { return; }

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

	private boardOrDeboard(
		timeSinceStart: number, timeInState: number, stepTime: number,
		action: () => void,
	) {
		const numPaxDone = Math.ceil(timeSinceStart / stepTime);
		const numPaxTodo = Math.ceil(timeInState / stepTime);
		for (let i = numPaxDone; i < numPaxTodo; i++) {
			action();
		}
	}

	private stepBoardOnePax(trainConfig: TrainConfig) {
		this.loopTrainBoardingPos((pos) => {
			const pax = pos.dequeuePax();
			if (!pax) { return; }
			this.paxBoardingTrain.add(pax);
			const firstCar = firstCarStoppingPos(
				trainConfig.cars, this.boardingPositions.length
			);
			pax.queueTarget(pos.associatedDoorPos, () => {
				this.paxBoardingTrain.delete(pax);
				const boardResult = canBoard(
					pax, trainConfig, pos.trackCarIndex - firstCar, this.trains, null
				);
				if (boardResult !== true) {
					this.failedBoard(pos.associatedDoorPos, boardResult);
				}
			});
		});
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
