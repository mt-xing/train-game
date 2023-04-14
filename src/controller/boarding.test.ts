import Pax from '../model/pax';
import { canBoard } from './boarding';

it('sorts by destination correctly', () => {
	const pax = new Pax({
		destination: 'test',
		timing: [],
		blue: false,
		reservation: null,
		women: false,
		handicap: false,
	});
	const pax2 = new Pax({
		destination: 'test2',
		timing: [],
		blue: false,
		reservation: null,
		women: false,
		handicap: false,
	});
	const train = {
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
	expect(canBoard(pax, train, 0, [], null)).toBe(true);
	expect(canBoard(pax2, train, 0, [], null)).toBe(false);
});
