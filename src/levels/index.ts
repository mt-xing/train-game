import { PaxConfig } from '../model/pax';
import { TrainConfig } from '../model/train';

export type Level = {
	trains: [TrainConfig[], TrainConfig[]],
	timeInitial: number;
	timeGap: number;
	health: number;
	pax: [number, PaxConfig][] | (() => [number, PaxConfig][])
}
