import { BoardingResult } from '../controller/boarding';
import { resultToHealthDeduction } from '../controller/health';
import { Level } from '../levels';
import { Pos } from '../utils';
import { Pax, PaxBase, PaxConfig } from './pax';
import Track from './track';

export default class TrainGame {
	private time: number;

	private healthLeft: number;

	private tracks: [Track, Track];

	/** Unspawned pax in backwards order; last element is next to spawn */
	private unspawnedPax: [number, PaxConfig][];

	private paxQueue: Pax[];

	private platformPax: Set<Pax>;

	private platformDeboardPax: Set<PaxBase>;

	constructor(level: Level) {
		this.time = 0;
		this.healthLeft = level.health;
		this.tracks = [
			new Track(
				level.timeInitial,
				level.timeGap,
				level.trains[0],
				true,
				this.spawnDeboardedPax.bind(this),
				this.failedBoard.bind(this),
			),
			new Track(
				level.timeInitial * 1.5,
				level.timeGap,
				level.trains[1],
				false,
				this.spawnDeboardedPax.bind(this),
				this.failedBoard.bind(this),
			),
		];
		this.unspawnedPax = (Array.isArray(level.pax) ? level.pax : level.pax())
			.sort((a, b) => b[0] - a[0]);
		this.paxQueue = [];
		this.platformPax = new Set();
		this.platformDeboardPax = new Set();
	}

	step(timeDelta: number) {
		this.tracks.forEach((t) => t.step(timeDelta));
		this.platformPax.forEach((p) => p.step(timeDelta));
		this.platformDeboardPax.forEach((p) => p.step(timeDelta));
		this.paxQueue.forEach((p) => p.step(timeDelta));

		this.time += timeDelta;

		while (this.unspawnedPax.length > 0
			&& this.unspawnedPax[this.unspawnedPax.length - 1][0] < this.time) {
			const p = this.unspawnedPax.pop();
			if (!p) { throw new Error(); }
			this.paxQueue.push(new Pax(p[1]));
		}
	}

	private spawnDeboardedPax(pos: Pos): void {
		const p = new PaxBase();
		p.spawn(pos);
		this.platformDeboardPax.add(p);
		// TODO actual spawn and despawn point
		p.queueTarget([0, 0], () => this.platformDeboardPax.delete(p));
	}

	private failedBoard(pos: Pos, result: BoardingResult) {
		const healthDeduct = resultToHealthDeduction(result);
		this.healthLeft -= healthDeduct;
		// eslint-disable-next-line no-console
		console.log(`Boarding error at ${JSON.stringify(pos)} due to ${JSON.stringify(result)}`);
	}
}
