export type TrainConfig = {
	destination: string;
	uiTime: number;
	type: 'local' | 'rapid' | 'express' | 'ltd exp';
	airport: boolean;
	cars: number;
	doors: number;
	/** Women-only cars (zero-indexed); null = none */
	women: null | number[];
	/** Blue cars (zero-indexed); null = none */
	blue: null | number[];
	/** Reserved cars (zero-indexed); boolean = all or none */
	reserved: boolean | number[];
}

export default class Train {
	private settings: TrainConfig;

	constructor(config: TrainConfig) {
		this.settings = config;
	}

	get config() { return this.settings; }
}
