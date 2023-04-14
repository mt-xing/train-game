import Pax, { PaxConfig } from '../model/pax';
import { TrainConfig } from '../model/train';
import { canBoard } from './boarding';

const paxBase: PaxConfig = {
	destination: 'test',
	timing: [],
	blue: false,
	reservation: null,
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
