import React from 'react';
import { observer } from 'mobx-react';
import { AdaptiveAddress } from '../../controls/AdaptiveAddress';

const TestPage = observer(() => {
	return (
		<div>
			<h1>test page</h1>
			<br />
			<br />
			<br />
			testing yoy
			<br />
			<div
				style={{
					width: 350,
					border: '1px solid red',
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'flex-start',
				}}
			>
				<AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
			</div>
		</div>
	);
});

export default TestPage;
