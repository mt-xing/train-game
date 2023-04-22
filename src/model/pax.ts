export type PaxConfig = {
	destination: string;
	/** Local, Rapid, Express (local, rapid), or other */
	timing: [] | [number] | [number, number] | 'airport' | 'ltd exp';
	blue: boolean;
	reservation: boolean;
	women: boolean;
	handicap: boolean;
}

export default class Pax {
	private settings: PaxConfig;

	private upchargedReserved: number | null;

	private upchargedBlue: boolean;

	private upchargedLtdExp: boolean;

	constructor(config: PaxConfig) {
		this.settings = config;
		this.upchargedReserved = null;
		this.upchargedBlue = false;
		this.upchargedLtdExp = false;
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
}
