import { computeDoorsForPos } from './track';

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
		[2, 3, 4, 5]
	]);
});
