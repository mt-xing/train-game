import { platformWidth } from '../consts/balanceConsts';
import { defaultQueueGap, queueGap } from '../consts/visualConsts';
import { Pos } from '../utils';
import Pax from './pax';
import { TrainConfig } from './train';

export type BoardingPosConfig = {
	type: TrainConfig['type'];
	maxDoors: number;
	minCars: number;
}

const maxQueueLength = (platformWidth - queueGap) / 2;

export class BoardingPos {
	private cfg: BoardingPosConfig;

	private pax: Pax[];

	private pos: Pos;

	/** True = +y, False = -y */
	private dir: boolean;

	constructor(config: BoardingPosConfig, pos: Pos, growsInPlusY: boolean) {
		this.cfg = config;
		this.pax = [];
		this.pos = pos;
		this.dir = growsInPlusY;
	}

	get config() { return this.cfg; }

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
}
