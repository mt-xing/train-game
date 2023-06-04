import { PaxConfig } from '../model/pax';
import { TrainConfig } from '../model/train';

export type Level = {
	trains: [TrainConfig[], TrainConfig[]],
	timeInitial: number;
	timeGap: number;
	health: number;
	upchargeStations: ('blue' | 'reservation' | 'ltd exp')[];
	pax: [number, PaxConfig][] | (() => [number, PaxConfig][]);
}

// Test consts

const genericPaxA: PaxConfig = {
	destination: 'a',
	timing: [],
	blue: false,
	reservation: false,
	women: false,
	handicap: false,
};
const genericPaxB = { ...genericPaxA, destination: 'b' };

export const testLevel: Level = {
	trains: [[], []],
	timeInitial: 10000,
	timeGap: 30000,
	health: 100,
	upchargeStations: [],
	pax: [[0, genericPaxA], [2000, genericPaxB], [4000, genericPaxA], [6000, genericPaxB]],
};
