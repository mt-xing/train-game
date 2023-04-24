export function assertUnreachable(x: never): never {
	throw new Error(`Unreachable code reached: ${JSON.stringify(x)}`);
}

export type Pos = [number, number];

export function distance(x1: number, y1: number, x2: number, y2: number) {
	return Math.sqrt(
		(x2 - x1) ** 2 + (y2 - y1) ** 2
	);
}

export function step(
	x: number, y: number,
	destX: number, destY: number,
	dist: number,
): Pos {
	const deltaX = destX - x;
	const deltaY = destY - y;
	const deltaVecDist = distance(0, 0, deltaX, deltaY);
	const mult = dist / deltaVecDist;
	return [x + deltaX * mult, y + deltaY * mult];
}
