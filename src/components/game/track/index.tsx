import React from 'react';

type TrackProps = {
	/** Flipped = left or up */
	flip: boolean;
};

function Track(props: TrackProps) {
	const { flip } = props;
	return (
		<section>
			<div>{flip ? 'oohC oohC' : 'Choo choo'}</div>
		</section>
	);
}

export default Track;
