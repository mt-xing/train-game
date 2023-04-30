import { platformWidth } from '../consts/balanceConsts';
import { defaultQueueGap, queueGap } from '../consts/visualConsts';
import { Pax } from './pax';
import { Pos } from '../utils';
import { TrainConfig } from './train';

export type BoardingPosType = TrainConfig['type'] | 'airport';

const maxQueueLength = (platformWidth - queueGap) / 2;

export class BoardingPos {
	private t: BoardingPosType;

	private doors: Set<number>;

	private cars: Set<number>;

	/** Zero-index of car on platform */
	private carIndex: number;

	private pax: Pax[];

	private pos: Pos;

	/** Position of the associated door */
	private adp: Pos;

	/** True = +y, False = -y */
	private dir: boolean;

	constructor(
		type: BoardingPosType, doors: number[], cars: number[], carIndex: number,
		pos: Pos, growsInPlusY: boolean, associatedDoorPosition: Pos,
	) {
		this.t = type;
		this.doors = new Set(doors);
		this.cars = new Set(cars);
		this.carIndex = carIndex;
		this.pax = [];
		this.pos = pos;
		this.dir = growsInPlusY;
		this.adp = associatedDoorPosition;
	}

	get type() { return this.t; }

	get doorSet() { return this.doors.values(); }

	get carSet() { return this.cars.values(); }

	get position() { return this.pos; }

	get associatedDoorPos() { return this.adp; }

	get trackCarIndex() { return this.carIndex; }

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
		if (p) {
			this.readjustAllPax();
		}
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
