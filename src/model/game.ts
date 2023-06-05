import { carGap, carLength, platformWidth } from '../consts/balanceConsts';
import { BoardingResult, canBoardFast } from '../controller/boarding';
import { missedTrainDeduction, resultToHealthDeduction } from '../controller/health';
import { Level } from '../levels';
import { Pos } from '../utils';
import { BoardingPos } from './boardingPos';
import { Pax, PaxBase, PaxConfig } from './pax';
import { GameState, TrackState } from './stateTypes';
import Track from './track';
import { TrainConfig } from './train';

export default class TrainGame {
	private time: number;

	private healthLeft: number;

	private platformSize: Pos;

	private spawnPos: Pos;

	private tracks: [Track, Track];

	/** Unspawned pax in backwards order; last element is next to spawn */
	private unspawnedPax: [number, PaxConfig][];

	private paxQueue: Pax[];

	private platformPax: Set<Pax>;

	private platformDeboardPax: Set<PaxBase>;

	constructor(level: Level) {
		this.time = performance.now();
		this.healthLeft = level.health;
		this.tracks = [0, 1].map((id) => new Track(
			level.timeInitial,
			level.timeGap,
			level.trains[id],
			id === 0,
			this.spawnDeboardedPax.bind(this),
			this.failedBoard.bind(this),
			this.trainDepart.bind(this),
		)) as [Track, Track];
		this.unspawnedPax = (Array.isArray(level.pax) ? level.pax : level.pax())
			.sort((a, b) => b[0] - a[0]);
		this.paxQueue = [];
		this.platformPax = new Set();
		this.platformDeboardPax = new Set();

		const maxTrainCars = this.tracks.reduce(
			(a, x) => (a > x.boardingPos.length ? a : x.boardingPos.length), 0
		);
		this.platformSize = [maxTrainCars * (carLength + carGap), platformWidth];
		this.spawnPos = this.platformSize.map((x) => x / 2) as Pos;
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

	get state(): GameState {
		const platformPax = Array.from(this.platformPax).map((x) => x.position);
		const platformDeboard = Array.from(this.platformDeboardPax).map((x) => x.position);
		const trackPax = this.tracks.map((track) => track.allPaxPos).flat(3);

		const allPax =	platformPax.concat(platformDeboard).concat(trackPax)
			.filter((x): x is Pos => x !== null);
		return {
			tracks: this.tracks.map((x) => x.state) as [TrackState, TrackState],
			platform: {
				pax: allPax.map((p) => ({ x: p[0], y: p[1] })),
				upchargeStations: [],
			}
		};
	}

	get boardingPos(): [BoardingPos[], BoardingPos[]] {
		return this.tracks.map((x) => x.boardingPos.flat(3)) as [BoardingPos[], BoardingPos[]];
	}

	sendPaxToLoc(pax: Pax, loc: Pos, callback?: () => void) {
		if (!pax.isSpawned) {
			this.paxQueue = this.paxQueue.filter((x) => x !== pax);
			pax.spawn(this.spawnPos);
			this.platformPax.add(pax);
		}
		pax.queueTarget(loc, callback);
	}

	private spawnDeboardedPax(pos: Pos): void {
		const p = new PaxBase();
		p.spawn(pos);
		this.platformDeboardPax.add(p);
		p.queueTarget(this.spawnPos, () => this.platformDeboardPax.delete(p));
	}

	private loseHealth(amount: number) {
		if (amount >= this.healthLeft) {
			// TODO lose game
			this.healthLeft = 0;
		} else {
			this.healthLeft -= amount;
		}
	}

	private failedBoard(pos: Pos, result: BoardingResult) {
		const healthDeduct = resultToHealthDeduction(result);
		this.loseHealth(healthDeduct);
		// eslint-disable-next-line no-console
		console.log(`Boarding error at ${JSON.stringify(pos)} due to ${JSON.stringify(result)}`);
	}

	private trainDepart(train: TrainConfig, depBoard: TrainConfig[]) {
		this.tracks.forEach((t) => {
			t.forEachBoardingPos((pos) => {
				pos.forEach((pax) => {
					if (canBoardFast(pax, train, depBoard)) {
						// Pax missed train
						this.loseHealth(missedTrainDeduction);
					}
				});
			});
		});

		const process = (pax: Pax) => {
			if (!pax.isAnnoyable) { return; }
			if (canBoardFast(pax, train, depBoard)) {
				// Pax missed train
				this.loseHealth(missedTrainDeduction);
			}
		};

		this.platformPax.forEach(process);
		this.paxQueue.forEach(process);
	}
}
