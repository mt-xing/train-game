import { assertUnreachable } from '../utils';
import Train, { TrainConfig } from './train';

export const trainStallTime = 10000;
export const trainAccelerateTime = 5000;

export class Track {
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

	constructor(initial: number, gap: number, trains: TrainConfig[]) {
		this.trains = trains.map((_, i, a) => a[a.length - i - 1]);
		this.stationTrain = { state: 'none', lastTrainLeft: 0 };
		this.timeGap = gap;
		this.timeInitial = initial;
		this.time = 0;
		if (gap < trainStallTime + 2 * trainAccelerateTime) {
			throw new Error('Train gap too small');
		}
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
