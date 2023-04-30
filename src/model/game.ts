import { Level } from '../levels';
import Pax, { PaxConfig } from './pax';
import Track from './track';

export default class TrainGame {
	private time: number;

	private healthLeft: number;

	private tracks: [Track, Track];

	/** Unspawned pax in backwards order; last element is next to spawn */
	private unspawnedPax: [number, PaxConfig][];

	private paxQueue: Pax[];

	private platformPax: Set<Pax>;

	constructor(level: Level) {
		this.time = 0;
		this.healthLeft = level.health;
		this.tracks = [
			new Track(level.timeInitial, level.timeGap, level.trains[0], true),
			new Track(level.timeInitial * 1.5, level.timeGap, level.trains[1], false),
		];
		this.unspawnedPax = (Array.isArray(level.pax) ? level.pax : level.pax())
			.sort((a, b) => b[0] - a[0]);
		this.paxQueue = [];
		this.platformPax = new Set();
	}

	step(timeDelta: number) {
		this.tracks.forEach((t) => t.step(timeDelta));
		this.platformPax.forEach((p) => p.step(timeDelta));
		this.paxQueue.forEach((p) => p.step(timeDelta));

		this.time += timeDelta;

		while (this.unspawnedPax.length > 0
			&& this.unspawnedPax[this.unspawnedPax.length - 1][0] < this.time) {
			const p = this.unspawnedPax.pop();
			if (!p) { throw new Error(); }
			this.paxQueue.push(new Pax(p[1]));
		}
	}
}
