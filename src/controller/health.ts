import { assertUnreachable } from '../utils';
import { BoardingResult } from './boarding';

const low = 2;
const medium = 4;
const bad = 7;
const catastrophic = 10;

export const missedTrainDeduction = medium;

export function resultToHealthDeduction(result: BoardingResult): number {
	switch (result) {
	case true:
		return 0;
	case false:
		// Does not serve destination
		return catastrophic;
	case 'carIllegal':
		// Women only car
		return bad;
	case 'costUndesired':
		// Got on upcharge you didn't want
		return bad;
	case 'costUnpaid':
		// Got on upcharge you haven't paid for
		return bad;
	case 'costOverpaid':
		// Didn't get on upcharge you paid for
		return bad;
	case 'slowLtdExp':
		// Didn't get on Ltd Exp you wanted
		return bad;
	case 'slow':
		// Got on slower train than needed (non ltd exp)
		return medium;
	case 'carDelay':
		// Handicap
		return medium;
	case 'costDidntGetDesired':
		// Didn't get on upcharge you wanted (haven't paid yet)
		return medium;
	case 'costReservedGotNonreserved':
		// Paid for reservation but got on nonreserved car
		return medium;
	case 'carWrongReserved':
		// Paid for reservation and got on other reservedcar
		return low;
	default: assertUnreachable(result);
	}
}
