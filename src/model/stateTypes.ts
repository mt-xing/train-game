import { Pos } from '../utils';
import { BoardingPosType } from './boardingPos';

export type PaxState = {
	x: number,
	y: number,
};

export type TrackState = {
	trainState: 'none' | 'arriving' | 'idle' | 'departing',
	trainCars: number,
	trainDoors: number,
	boardingPos: BoardingPosType[][][],
}

export type PlatformState = {
	pax: PaxState[],
	upchargeStations: {type: 'blue' | 'reservation' | 'ltd exp', pos: Pos}[]
}

export type GameState = {
	tracks: [TrackState, TrackState],
	platform: PlatformState,
}
