import Pax, { PaxConfig } from '../model/pax';
import { TrainConfig } from '../model/train';
import { canBoard } from './boarding';

const paxBase: PaxConfig = {
	destination: 'test',
	timing: [],
	blue: false,
	reservation: false,
	women: false,
	handicap: false,
};

const trainBase: TrainConfig = {
	uiTime: 0,
	destination: 'test',
	type: 'local' as const,
	airport: false,
	cars: 4,
	doors: 2,
	women: null,
	blue: null,
	reserved: false,
};
const trainRapid = { ...trainBase, type: 'rapid' as const };
const trainExpress = { ...trainBase, type: 'express' as const };
const trainLtdExp = { ...trainBase, type: 'ltd exp' as const };

it('sorts by destination correctly', () => {
	const pax = new Pax(paxBase);
	const pax2 = new Pax({
		...paxBase,
		destination: 'test2',
	});
	expect(canBoard(pax, trainBase, 0, [], null)).toBe(true);
	expect(canBoard(pax2, trainBase, 0, [], null)).toBe(false);
});

function testSlowTrain(
	pax: Pax,
	currentTrain: TrainConfig,
	nextTrain: TrainConfig,
	cutoverTime:number
) {
	expect(canBoard(pax, currentTrain, 0, [{ ...nextTrain, uiTime: 1 }], null)).toBe('slow');
	expect(canBoard(pax, currentTrain, 0, [{ ...nextTrain, uiTime: cutoverTime - 1 }], null)).toBe('slow');
	expect(canBoard(pax, currentTrain, 0, [{ ...nextTrain, uiTime: cutoverTime }], null)).toBe(true);
	expect(
		canBoard(pax, currentTrain, 0, [{ ...nextTrain, uiTime: cutoverTime + 1 }], null)
	).toBe(true);
}

it('handles rapid trains', () => {
	const paxLocal = new Pax(paxBase);
	const paxRapid = new Pax({
		...paxBase,
		timing: [12],
	});
	expect(canBoard(paxLocal, trainBase, 0, [], null)).toBe(true);
	expect(canBoard(paxRapid, trainBase, 0, [], null)).toBe(true);

	expect(canBoard(paxLocal, trainRapid, 0, [], null)).toBe(false);
	expect(canBoard(paxRapid, trainRapid, 0, [], null)).toBe(true);

	testSlowTrain(paxRapid, trainBase, trainRapid, 12);
});

it('handles express trains', () => {
	const paxLocal = new Pax(paxBase);
	const paxRapid = new Pax({
		...paxBase,
		timing: [12],
	});
	const paxExpress = new Pax({
		...paxBase,
		timing: [15, 9],
	});
	expect(canBoard(paxLocal, trainBase, 0, [], null)).toBe(true);
	expect(canBoard(paxRapid, trainBase, 0, [], null)).toBe(true);
	expect(canBoard(paxExpress, trainBase, 0, [], null)).toBe(true);

	expect(canBoard(paxLocal, trainRapid, 0, [], null)).toBe(false);
	expect(canBoard(paxRapid, trainRapid, 0, [], null)).toBe(true);
	expect(canBoard(paxExpress, trainRapid, 0, [], null)).toBe(true);

	expect(canBoard(paxLocal, trainExpress, 0, [], null)).toBe(false);
	expect(canBoard(paxRapid, trainExpress, 0, [], null)).toBe(false);
	expect(canBoard(paxExpress, trainExpress, 0, [], null)).toBe(true);

	testSlowTrain(paxExpress, trainBase, trainRapid, 6);
	testSlowTrain(paxExpress, trainBase, trainExpress, 15);
	testSlowTrain(paxExpress, trainRapid, trainExpress, 9);

	expect(canBoard(paxExpress, trainBase, 0, [
		{ ...trainRapid, uiTime: 6 }, // Slower
		{ ...trainExpress, uiTime: 14 }, // Faster
	], null)).toBe('slow');

	expect(canBoard(paxExpress, trainBase, 0, [
		{ ...trainRapid, uiTime: 5 }, // Faster
		{ ...trainExpress, uiTime: 15 }, // Slower
	], null)).toBe('slow');

	expect(canBoard(paxExpress, trainBase, 0, [
		{ ...trainRapid, uiTime: 6 }, // Slower
		{ ...trainExpress, uiTime: 15 }, // Slower
	], null)).toBe(true);
});

it('handles limited express trains', () => {
	const paxLtd = new Pax({ ...paxBase, timing: 'ltd exp' });
	expect(canBoard(paxLtd, trainBase, 0, [], null)).toBe(true);
	expect(canBoard(paxLtd, trainRapid, 0, [], null)).toBe(true);
	expect(canBoard(paxLtd, trainExpress, 0, [], null)).toBe(true);
	expect(canBoard(paxLtd, trainBase, 0, [trainLtdExp], null)).toBe('slowLtdExp');
	expect(canBoard(paxLtd, trainRapid, 0, [trainLtdExp], null)).toBe('slowLtdExp');
	expect(canBoard(paxLtd, trainExpress, 0, [trainLtdExp], null)).toBe('slowLtdExp');

	expect(canBoard(paxLtd, trainLtdExp, 0, [], null)).toBe('costUnpaid');

	paxLtd.payUpchargeLtdExp();
	expect(canBoard(paxLtd, trainBase, 0, [], null)).toBe(true);
	expect(canBoard(paxLtd, trainRapid, 0, [], null)).toBe(true);
	expect(canBoard(paxLtd, trainExpress, 0, [], null)).toBe(true);
	expect(canBoard(paxLtd, trainBase, 0, [trainLtdExp], null)).toBe('slowLtdExp');
	expect(canBoard(paxLtd, trainRapid, 0, [trainLtdExp], null)).toBe('slowLtdExp');
	expect(canBoard(paxLtd, trainExpress, 0, [trainLtdExp], null)).toBe('slowLtdExp');
	expect(canBoard(paxLtd, trainLtdExp, 0, [], null)).toBe(true);

	const slowPax = new Pax(paxBase);
	expect(canBoard(slowPax, trainLtdExp, 0, [], null)).toBe(false);
});

it('handles airport trains', () => {
	const paxAirport = new Pax({ ...paxBase, timing: 'airport' });
	expect(canBoard(paxAirport, trainBase, 0, [], null)).toBe(false);
	expect(canBoard(paxAirport, trainRapid, 0, [], null)).toBe(false);
	expect(canBoard(paxAirport, trainExpress, 0, [], null)).toBe(false);
	expect(canBoard(paxAirport, trainLtdExp, 0, [], null)).toBe(false);
	expect(canBoard(paxAirport, { ...trainBase, airport: true }, 0, [], null)).toBe(true);
	expect(canBoard(paxAirport, { ...trainRapid, airport: true }, 0, [], null)).toBe(true);
	expect(canBoard(paxAirport, { ...trainExpress, airport: true }, 0, [], null)).toBe(true);
	expect(canBoard(paxAirport, { ...trainLtdExp, airport: true }, 0, [], null)).toBe('costUnpaid');
	paxAirport.payUpchargeLtdExp();
	expect(canBoard(paxAirport, { ...trainLtdExp, airport: true }, 0, [], null)).toBe(true);
	const slowPax = new Pax(paxBase);
	expect(canBoard(slowPax, { ...trainBase, airport: true }, 0, [], null)).toBe(true);
	expect(canBoard(slowPax, { ...trainRapid, airport: true }, 0, [], null)).toBe(false);
	expect(canBoard(slowPax, { ...trainExpress, airport: true }, 0, [], null)).toBe(false);
	const rapidPax = new Pax({ ...paxBase, timing: [2] });
	expect(canBoard(rapidPax, { ...trainBase, airport: true }, 0, [], null)).toBe(true);
	expect(canBoard(rapidPax, { ...trainRapid, airport: true }, 0, [], null)).toBe(true);
	expect(canBoard(rapidPax, { ...trainExpress, airport: true }, 0, [], null)).toBe(false);
	const expPax = new Pax({ ...paxBase, timing: [20, 7] });
	expect(canBoard(expPax, { ...trainBase, airport: true }, 0, [
		{ ...trainRapid, uiTime: 6 }
	], null)).toBe('slow');
	expect(canBoard(expPax, { ...trainRapid, airport: true }, 0, [], null)).toBe(true);
	expect(canBoard(expPax, { ...trainExpress, airport: true }, 0, [], null)).toBe(true);

	const ltdExpPax = new Pax({ ...paxBase, timing: 'ltd exp' });
	expect(canBoard(ltdExpPax, { ...trainLtdExp, airport: true }, 0, [], null)).toBe('costUnpaid');
	ltdExpPax.payUpchargeLtdExp();
	expect(canBoard(ltdExpPax, { ...trainLtdExp, airport: true }, 0, [], null)).toBe(true);
	expect(canBoard(ltdExpPax, { ...trainRapid, airport: true }, 0, [], null)).toBe(true);
	expect(canBoard(ltdExpPax, { ...trainRapid, airport: true }, 0, [trainLtdExp], null)).toBe('slowLtdExp');
});

it('discriminates on gender', () => {
	const paxM = new Pax(paxBase);
	const paxF = new Pax({ ...paxBase, women: true });

	const train = { ...trainBase, women: [1] };
	expect(canBoard(paxM, train, 0, [], null)).toBe(true);
	expect(canBoard(paxF, train, 0, [], null)).toBe(true);
	expect(canBoard(paxM, train, 1, [], null)).toBe('carIllegal');
	expect(canBoard(paxF, train, 1, [], null)).toBe(true);

	const train2 = { ...trainBase, women: [2, 3] };
	expect(canBoard(paxM, train2, 0, [], null)).toBe(true);
	expect(canBoard(paxF, train2, 0, [], null)).toBe(true);
	expect(canBoard(paxM, train2, 1, [], null)).toBe(true);
	expect(canBoard(paxF, train2, 1, [], null)).toBe(true);
	expect(canBoard(paxM, train2, 2, [], null)).toBe('carIllegal');
	expect(canBoard(paxF, train2, 2, [], null)).toBe(true);
	expect(canBoard(paxM, train2, 3, [], null)).toBe('carIllegal');
	expect(canBoard(paxF, train2, 3, [], null)).toBe(true);

	const paxHandicap = new Pax({ ...paxBase, handicap: true });
	expect(canBoard(paxHandicap, train2, 0, [], 1)).toBe('carDelay');
	expect(canBoard(paxHandicap, train2, 1, [], 1)).toBe(true);
	expect(canBoard(paxHandicap, train2, 2, [], 1)).toBe('carDelay');
	expect(canBoard(paxHandicap, train2, 3, [], 3)).toBe(true);
});

it('complies with ada', () => {
	const pax = new Pax(paxBase);
	const paxHandicap = new Pax({ ...paxBase, handicap: true });

	expect(canBoard(pax, trainBase, 0, [], null)).toBe(true);
	expect(canBoard(paxHandicap, trainBase, 0, [], null)).toBe('carDelay');
	expect(canBoard(pax, trainBase, 0, [], 0)).toBe(true);
	expect(canBoard(paxHandicap, trainBase, 0, [], 0)).toBe(true);
	expect(canBoard(pax, trainBase, 2, [], 1)).toBe(true);
	expect(canBoard(paxHandicap, trainBase, 2, [], 1)).toBe('carDelay');
});

it('reserves seats', () => {
	const paxCheap = new Pax(paxBase);
	const paxRes = new Pax({ ...paxBase, reservation: true });
	const train = { ...trainBase, reserved: [2, 3] };
	const trainAll = { ...trainBase, reserved: true };

	expect(canBoard(paxCheap, train, 1, [], null)).toBe(true);
	expect(canBoard(paxCheap, train, 2, [], null)).toBe('costUndesired');
	expect(canBoard(paxCheap, trainAll, 0, [], null)).toBe('costUndesired');
	expect(canBoard(paxRes, trainBase, 0, [], null)).toBe('costDidntGetDesired');
	expect(canBoard(paxRes, train, 1, [], null)).toBe('costDidntGetDesired');
	expect(canBoard(paxRes, train, 2, [], null)).toBe('costUnpaid');
	expect(canBoard(paxRes, trainAll, 0, [], null)).toBe('costUnpaid');

	paxRes.payUpchargeReserved(2);
	expect(canBoard(paxRes, trainBase, 1, [], null)).toBe('costOverpaid');
	expect(canBoard(paxRes, train, 2, [], null)).toBe(true);
	expect(canBoard(paxRes, train, 3, [], null)).toBe('carWrongReserved');
	expect(canBoard(paxRes, train, 1, [], null)).toBe('costReservedGotNonreserved');
	expect(canBoard(paxRes, trainAll, 0, [], null)).toBe('carWrongReserved');
	expect(canBoard(paxRes, trainAll, 1, [], null)).toBe('carWrongReserved');
	expect(canBoard(paxRes, trainAll, 2, [], null)).toBe(true);
	expect(canBoard(paxRes, trainAll, 3, [], null)).toBe('carWrongReserved');
});

it('segregates blue cars', () => {
	const paxCheap = new Pax(paxBase);
	const paxBlue = new Pax({ ...paxBase, blue: true });
	const train = { ...trainBase, blue: [2, 3] };

	expect(canBoard(paxCheap, train, 1, [], null)).toBe(true);
	expect(canBoard(paxCheap, train, 2, [], null)).toBe('costUndesired');

	expect(canBoard(paxBlue, train, 1, [], null)).toBe('costDidntGetDesired');
	expect(canBoard(paxBlue, train, 2, [], null)).toBe('costUnpaid');
	paxBlue.payUpchargeBlue();
	expect(canBoard(paxBlue, train, 1, [], null)).toBe('costOverpaid');
	expect(canBoard(paxBlue, train, 2, [], null)).toBe(true);
});

it('prioritises violations correctly', () => {
	// Doesn't serve destination
	expect(canBoard(new Pax(paxBase), { ...trainRapid, blue: [0] }, 0, [], null)).toBe(false);
	// Undesired upcharge
	expect(canBoard(new Pax(paxBase), {
		...trainBase, blue: [0], women: [0]
	}, 0, [], null)).toBe('costUndesired');
	const blueMale = new Pax({ ...paxBase, blue: true });
	expect(canBoard(blueMale, {
		...trainBase, blue: [0], women: [0]
	}, 0, [], null)).toBe('costUnpaid');
	blueMale.payUpchargeBlue();
	expect(canBoard(blueMale, {
		...trainBase, blue: [1], women: [0]
	}, 0, [], null)).toBe('costOverpaid');
	const resMale = new Pax({ ...paxBase, reservation: true });
	resMale.payUpchargeReserved(1);
	expect(canBoard(resMale, {
		...trainBase, reserved: [1], women: [0]
	}, 0, [], null)).toBe('costReservedGotNonreserved');
	// Illegal
	expect(canBoard(new Pax({ ...paxBase, timing: [10] }), {
		...trainBase, women: [0]
	}, 0, [{ ...trainRapid, uiTime: 1 }], null)).toBe('carIllegal');
	// Slow
	expect(canBoard(new Pax({
		...paxBase, timing: [10], handicap: true,
	}), trainBase, 0, [{ ...trainRapid, uiTime: 1 }], 1)).toBe('slow');
	expect(canBoard(new Pax({
		...paxBase, timing: 'ltd exp', handicap: true,
	}), trainBase, 0, [{ ...trainLtdExp, uiTime: 1 }], 1)).toBe('slowLtdExp');
	// Handicap
	expect(canBoard(new Pax({
		...paxBase, blue: true, handicap: true,
	}), trainBase, 0, [{ ...trainRapid, uiTime: 1 }], 1)).toBe('carDelay');
	// Missing desired upcharge
	const blueResPax = new Pax({ ...paxBase, blue: true, reservation: true });
	const blueResTrain = { ...trainBase, reserved: [2], blue: [2] };
	expect(canBoard(blueResPax, blueResTrain, 0, [], null)).toBe('costDidntGetDesired');
	// Wrong reserved car
	blueResPax.payUpchargeBlue();
	blueResPax.payUpchargeReserved(2);
	expect(canBoard(blueResPax, { ...blueResTrain, blue: [0, 2], reserved: [0, 2] }, 0, [], null)).toBe('carWrongReserved');
});
