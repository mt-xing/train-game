import { platformWidth } from '../consts/balanceConsts';
import { defaultQueueGap, queueGap } from '../consts/visualConsts';
import { Pos } from '../utils';
import Pax from './pax';
import { TrainConfig } from './train';

export type BoardingPosType = TrainConfig['type'] | 'airport';

const maxQueueLength = (platformWidth - queueGap) / 2;

export class BoardingPos {
	private t: BoardingPosType;

	private doors: Set<number>;

	private cars: Set<number>;

	private pax: Pax[];

	private pos: Pos;

	/** True = +y, False = -y */
	private dir: boolean;

	constructor(
		type: BoardingPosType, doors: number[], cars: number[], pos: Pos, growsInPlusY: boolean
	) {
		this.t = type;
		this.doors = new Set(doors);
		this.cars = new Set(cars);
		this.pax = [];
		this.pos = pos;
		this.dir = growsInPlusY;
	}

	get type() { return this.t; }

	get doorSet() { return this.doors.values(); }

	get carSet() { return this.cars.values(); }

	hasDoor(doorNum: number) { return this.doors.has(doorNum); }

	hasCar(carNum: number) { return this.cars.has(carNum); }

	enqueuePax(pax: Pax) {
		this.pax.push(pax);
		if (this.pax.length === 1) {
			pax.queueTarget(this.pos);
		} else if (this.pax.length * defaultQueueGap <= maxQueueLength) {
			const newY = this.pos[1] + defaultQueueGap * (this.pax.length - 1) * (this.dir ? 1 : -1);
			pax.queueTarget([this.pos[0], newY]);
		} else {
			// Too full; need to shuffle everyone
			this.adjustAllPaxPosFull();
		}
	}

	dequeuePax() {
		const p = this.pax.shift();
		this.readjustAllPax();
		return p;
	}

	removePax(pax: Pax) {
		this.pax = this.pax.filter((x) => x !== pax);
		this.readjustAllPax();
	}

	private readjustAllPax() {
		if (this.pax.length * defaultQueueGap <= maxQueueLength) {
			this.pax.forEach((p, i) => {
				p.queueTarget([this.pos[0], this.pos[1] + defaultQueueGap * i]);
			});
		} else {
			this.adjustAllPaxPosFull();
		}
	}

	/**
	 * Recompute and queue move for all passengers if this queue is exceeding the space available.
	 *
	 * PRECONDITION: More pax than available space at default queue gap.
	 */
	private adjustAllPaxPosFull() {
		const newQueueGap = (maxQueueLength / this.pax.length) * (this.dir ? 1 : -1);
		this.pax.forEach((p, i) => {
			p.queueTarget([this.pos[0], this.pos[1] + newQueueGap * i]);
		});
	}

	step(timeDelta: number) {
		this.pax.forEach((p) => p.step(timeDelta));
	}
}
