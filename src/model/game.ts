export default class TrainGame {
	private time: number;

	constructor() {
		this.time = 0;
	}

	step(timeDelta: number) {
		this.time += timeDelta;
	}
}
