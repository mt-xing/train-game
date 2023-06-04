import React from 'react';
import './index.css';

type PlatformProps = {
	platformState: boolean;
};

function Platform(props: PlatformProps) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { platformState } = props;
	return (
		<section className='platform'>
		</section>
	);
}

export default Platform;
