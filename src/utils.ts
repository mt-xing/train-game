// eslint-disable-next-line import/prefer-default-export
export function assertUnreachable(x: never): never {
	throw new Error(`Unreachable code reached: ${JSON.stringify(x)}`);
}
