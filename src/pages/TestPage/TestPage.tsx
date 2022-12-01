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
					width: 550,
					border: '3px solid red',
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'flex-start',
					boxSizing: 'content-box',
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'flex-start',
						flexGrow: 1,
						background: 'rgba(0, 255, 0, 0.2)',
					}}
				>
					<AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
				</div>
			</div>
			<div
				style={{
					width: 550,
					border: '3px solid blue',
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'flex-start',
					boxSizing: 'content-box',
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'flex-start',
						flexGrow: 1,
						background: 'rgba(0, 255, 0, 0.2)',
					}}
				>
					<span style={{ whiteSpace: 'nowrap' }}>My address is </span>
					<AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
					<span style={{ whiteSpace: 'nowrap' }}> please write me</span>
				</div>
			</div>
		</div>
	);
});

export default TestPage;
