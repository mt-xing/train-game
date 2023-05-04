import { paxAnnoyTime, walkSpeed } from '../consts/balanceConsts';
import { distance, Pos, step } from '../utils';

export type PaxConfig = {
	destination: string;
	/** Local, Rapid, Express (local, rapid), or other */
	timing: [] | [number] | [number, number] | 'airport' | 'ltd exp';
	blue: boolean;
	reservation: boolean;
	women: boolean;
	handicap: boolean;
}

export class PaxBase {
	/** Visual position of this pax */
	protected pos: Pos | null;

	/** List of visual positions to walk to plus callback */
	private targets: [...Pos, undefined | (() => void)][];
	// There's a built in assumption here that upcharge stations
	// will not require stall time. Hopefully that holds.

	constructor() {
		this.pos = null;
		this.targets = [];
	}

	queueTarget(dest: Pos, callback?: () => void) {
		this.targets.push([dest[0], dest[1], callback]);
	}

	spawn(loc: Pos) {
		if (this.pos !== null) {
			throw new Error('Tried to spawn existing pax');
		}
		this.pos = loc;
	}

	step(timeDelta: number) {
		if (this.pos === null) { return; }

		if (this.targets.length === 0) { return; }
		const nextTarget = this.targets[0];

		const secFrac = timeDelta / 1000;
		const stepSize = secFrac * walkSpeed;

		if (distance(this.pos[0], this.pos[1], nextTarget[0], nextTarget[1]) < stepSize) {
			[this.pos[0], this.pos[1]] = nextTarget;
			this.targets.shift();
			if (nextTarget[2]) {
				nextTarget[2]();
			}
		} else {
			[this.pos[0], this.pos[1]] = step(
				this.pos[0], this.pos[1], nextTarget[0], nextTarget[1], stepSize
			);
		}
	}
}

export class Pax extends PaxBase {
	private settings: PaxConfig;

	private upchargedReserved: number | null;

	private upchargedBlue: boolean;

	private upchargedLtdExp: boolean;

	private timeSinceSpawn: number;

	constructor(config: PaxConfig) {
		super();
		this.settings = config;
		this.upchargedReserved = null;
		this.upchargedBlue = false;
		this.upchargedLtdExp = false;
		this.timeSinceSpawn = 0;
	}

	get config() { return this.settings; }

	get upchargePaidBlue() { return this.upchargedBlue; }

	get upchargePaidLtdExp() { return this.upchargedLtdExp; }

	get upchargePaidReserved() { return this.upchargedReserved; }

	payUpchargeBlue() {
		if (!this.config.blue) { return false; }
		if (this.upchargedBlue) { return false; }
		this.upchargedBlue = true;
		return true;
	}

	payUpchargeLtdExp() {
		if (this.config.timing !== 'ltd exp' && this.config.timing !== 'airport') { return false; }
		if (this.upchargedLtdExp) { return false; }
		this.upchargedLtdExp = true;
		return true;
	}

	payUpchargeReserved(car: number) {
		if (!this.config.reservation) { return false; }
		if (this.upchargedReserved) { return false; }
		this.upchargedReserved = car;
		return true;
	}

	get isSpawned() {
		return this.pos !== null;
	}

	get isAnnoyable() {
		return this.timeSinceSpawn >= paxAnnoyTime;
	}

	get patienceLeft() {
		if (this.isAnnoyable) { return 0; }
		return (paxAnnoyTime - this.timeSinceSpawn) / paxAnnoyTime;
	}

	step(timeDelta: number) {
		if (this.pos === null) { return; }

		this.timeSinceSpawn += timeDelta;

		super.step(timeDelta);
	}
}
