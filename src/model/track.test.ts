import { computeDoorsForPos, firstCarStoppingPos } from './track';

function checkAllDoors(allDoors: number[], maxDoors: number, expected: number[][]) {
	expected.forEach((e, i) => {
		const v = computeDoorsForPos(i, new Set(allDoors), maxDoors);
		expect(new Set(v)).toEqual(new Set(e));
	});
}

it('distributes one door trains', () => {
	checkAllDoors([1], 1, [[1]]);
});

it('distributes two door trains', () => {
	checkAllDoors([1, 2], 2, [[1, 2], [2]]);
});

it('distributes three door trains', () => {
	checkAllDoors([1, 2, 3], 3, [[1, 2, 3], [3], [2, 3]]);
});

it('distributes four door trains', () => {
	// Note the hard-coded 5 max doors, for symmetry
	checkAllDoors([1, 2, 3, 4], 5, [
		[1, 2, 3, 4], [4], [3], [4], [2, 3, 4]
	]);
});

it('distributes five door trains', () => {
	checkAllDoors([1, 2, 3, 4, 5], 5, [
		[1, 2, 3, 4, 5],
		[4, 5],
		[3, 5],
		[4, 5],
		[2, 3, 4, 5],
	]);
	checkAllDoors([3, 4, 5], 5, [
		[3, 4, 5],
		[4, 5],
		[3, 5],
		[4, 5],
		[3, 4, 5],
	]);
	checkAllDoors([4, 5], 5, [
		[4, 5],
		[4, 5],
		[5],
		[4, 5],
		[4, 5],
	]);
});

it('distributes six door trains', () => {
	checkAllDoors([1, 2, 3, 4, 5, 6], 6, [
		[1, 2, 3, 4, 5, 6],
		[5, 6],
		[3, 4, 5, 6],
		[4, 6],
		[5, 6],
		[2, 3, 4, 5, 6],
	]);
});

it('distributes seven door trains', () => {
	checkAllDoors([1, 2, 3, 4, 5, 6, 7], 7, [
		[1, 2, 3, 4, 5, 6, 7],
		[6, 7],
		[4, 5, 6, 7],
		[3, 5, 7],
		[4, 5, 6, 7],
		[6, 7],
		[2, 3, 4, 5, 6, 7],
	]);
});

it('stops trains on correct spot', () => {
	expect(firstCarStoppingPos(5, 5)).toBe(0);
	expect(firstCarStoppingPos(4, 5)).toBe(0);
	expect(firstCarStoppingPos(3, 5)).toBe(1);
	expect(firstCarStoppingPos(2, 5)).toBe(1);
	expect(firstCarStoppingPos(1, 5)).toBe(2);

	expect(firstCarStoppingPos(6, 6)).toBe(0);
	expect(firstCarStoppingPos(5, 6)).toBe(0);
	expect(firstCarStoppingPos(4, 6)).toBe(1);
	expect(firstCarStoppingPos(3, 6)).toBe(1);
	expect(firstCarStoppingPos(2, 6)).toBe(2);
	expect(firstCarStoppingPos(1, 6)).toBe(2);
});
