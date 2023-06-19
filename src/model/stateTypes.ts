import { Pos } from '../utils';
import { BoardingPosType } from './boardingPos';
import { Pax, PaxBase } from './pax';
import { TrainConfig } from './train';

export type TrackState = {
	trainState: 'none' | 'arriving' | 'idle' | 'departing',
	trainCars: number,
	trainDoors: number,
	boardingPos: BoardingPosType[][][],
	upcomingTrains: TrainConfig[],
}

export type PlatformState = {
	pax: PaxBase[],
	upchargeStations: {type: 'blue' | 'reservation' | 'ltd exp', pos: Pos}[]
}

export type GameState = {
	paxQueue: Pax[],
	tracks: [TrackState, TrackState],
	platform: PlatformState,
}
