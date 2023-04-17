import Pax from '../model/pax';
import { TrainConfig } from '../model/train';
import { assertUnreachable } from '../utils';

type Upcharge =
| 'costUnpaid'
| 'costUndesired'
| 'costOverpaid'
| 'costDidntGetDesired'
| 'costReservedGotNonreserved'
| 'carWrongReserved'

export type BoardingResult =
| boolean
| 'slow' | 'slowLtdExp'
| Upcharge
| 'carDelay' | 'carIllegal'

function trainServesDest(
	pax: Pax,
	train: TrainConfig,
): boolean {
	const paxConfig = pax.config;

	if (train.destination !== paxConfig.destination) { return false; }
	if (paxConfig.timing === 'airport' && !train.airport) { return false; }

	if (train.type === 'ltd exp' && paxConfig.timing !== 'ltd exp') {
		if (!train.airport || paxConfig.timing !== 'airport') {
			return false;
		}
	}

	if (Array.isArray(paxConfig.timing)) {
		switch (paxConfig.timing.length) {
		case 0:
			return train.type === 'local';
		case 1: {
			switch (train.type) {
			case 'rapid':
			case 'local':
				return true;
			default: return false;
			}
		}
		case 2: {
			switch (train.type) {
			case 'express':
			case 'rapid':
			case 'local':
				return true;
			default: return false;
			}
		}
		default:
			assertUnreachable(paxConfig.timing);
		}
	}

	return true;
}

function undesiredUpcharge(
	pax: Pax,
	train: TrainConfig,
	car: number,
): Upcharge | null {
	const paxConfig = pax.config;
	let didntGetDesired = false;
	let carWrongReserved = false;

	if (train.blue && train.blue.includes(car)) {
		if (!paxConfig.blue) {
			return 'costUndesired';
		}
		if (!pax.upchargePaidBlue) {
			return 'costUnpaid';
		}
	} else {
		if (pax.upchargePaidBlue) {
			return 'costOverpaid';
		}
		if (paxConfig.blue) {
			didntGetDesired = true;
		}
	}

	if (train.reserved === true || (train.reserved !== false && train.reserved.includes(car))) {
		// Got on a reserved car
		if (paxConfig.reservation === null) {
			return 'costUndesired';
		}
		if (pax.upchargePaidReserved === null) {
			return 'costUnpaid';
		}
		if (pax.upchargePaidReserved !== car) {
			carWrongReserved = true;
		}
	} else {
		// Got on a nonreserved car
		if (pax.upchargePaidReserved !== null) {
			return train.reserved !== false ? 'costReservedGotNonreserved' : 'costOverpaid';
		}
		if (paxConfig.reservation !== null) {
			didntGetDesired = true;
		}
	}

	if (train.type === 'ltd exp') {
		if (!pax.upchargePaidLtdExp) {
			return 'costUnpaid';
		}
	}
	// No else case here b/c ltd exp pax not getting on one is handled as slow train

	if (carWrongReserved) { return 'carWrongReserved'; }
	return didntGetDesired ? 'costDidntGetDesired' : null;
}

function trainSlow(
	pax: Pax,
	train: TrainConfig,
	departureBoard: TrainConfig[],
): boolean | 'slowLtdExp' {
	const paxConfig = pax.config;
	if (paxConfig.timing === 'airport') { return false; }

	if (train.type !== 'ltd exp') {
		if (paxConfig.timing === 'ltd exp') {
			return 'slowLtdExp';
		}
	}

	if (Array.isArray(paxConfig.timing)) {
		switch (paxConfig.timing.length) {
		case 0:
			break;
		case 1: {
			if (train.type === 'local') {
				const nextRapid = departureBoard.find((x) => x.type === 'rapid');
				if (nextRapid === undefined) { break; }
				const waitForNextTrain = nextRapid.uiTime - train.uiTime;
				if (waitForNextTrain < paxConfig.timing[0]) {
					return true;
				}
			}
			break;
		}
		case 2: {
			if (train.type === 'local' || train.type === 'rapid') {
				const nextExpress = departureBoard.find((x) => x.type === 'express');
				if (nextExpress !== undefined) {
					const waitForNextTrain = nextExpress.uiTime - train.uiTime;
					if (waitForNextTrain < (train.type === 'local' ? paxConfig.timing[0] : paxConfig.timing[1])) {
						return true;
					}
				}
				if (train.type === 'local') {
					const nextRapid = departureBoard.find((x) => x.type === 'rapid');
					if (nextRapid !== undefined) {
						const waitForNextTrain = nextRapid.uiTime - train.uiTime;
						if (waitForNextTrain < paxConfig.timing[0] - paxConfig.timing[1]) {
							return true;
						}
					}
				}
			}
			break;
		}
		default:
			assertUnreachable(paxConfig.timing);
		}
	}

	return false;
}

/**
 * Fast computation of whether a passenger was supposed to be on this train or not.
 * @returns True if this is the ideal train for a passenger, false otherwise
 */
export function canBoardFast(pax: Pax, train: TrainConfig, departureBoard: TrainConfig[]): boolean {
	const paxConfig = pax.config;

	if (!trainServesDest(pax, train)) { return false; }
	if ((train.type === 'ltd exp') !== (paxConfig.timing === 'ltd exp')) { return false; }
	// Not checking for paying upcharge b/c if too slow in queue that's the player's problem

	if (trainSlow(pax, train, departureBoard) !== false) {
		return false;
	}

	return true;
}

/**
	 * Whether a particular passenger can board this train
	 * @param pax
	 * @param train
	 * @param car
	 * @param departureBoard
	 * @param handicapCar
	 * @returns Boarding result
	 */
export function canBoard(
	pax: Pax,
	train: TrainConfig,
	car: number,
	departureBoard: TrainConfig[],
	handicapCar: number | null,
): BoardingResult {
	const paxConfig = pax.config;

	if (!trainServesDest(pax, train)) { return false; }

	// Below this line, pax is on a train that serves their destination

	// Undesired upcharge - BAD
	const upcharge = undesiredUpcharge(pax, train, car);
	switch (upcharge) {
	case 'costDidntGetDesired':
	case 'carWrongReserved':
	case null:
		break;
	default:
		return upcharge;
	}
	if (upcharge !== null) { return upcharge; }

	// Illegal (women-only) - BAD
	const illegalWomen = train.women?.includes(car) && !paxConfig.women && !paxConfig.handicap;
	if (illegalWomen) { return 'carIllegal'; }

	// Too slow - MEDIUM to BAD
	const slow = trainSlow(pax, train, departureBoard);
	if (slow !== false) { return slow === 'slowLtdExp' ? 'slowLtdExp' : 'slow'; }

	// Non-Handicap - MEDIUM
	if (paxConfig.handicap && car !== handicapCar) { return 'carDelay'; }

	// Wrong Car (reserved) - LOW
	if (upcharge === 'costDidntGetDesired') { return 'carWrongReserved'; }

	return true;
}
