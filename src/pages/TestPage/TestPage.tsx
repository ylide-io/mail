import { observer } from 'mobx-react';
import React from 'react';

import { AdaptiveAddress } from '../../controls/adaptiveAddress/adaptiveAddress';
import css from './TestPage.module.scss';

export const TestPage = observer(() => {
	return (
		<div
			className={css.root}
			style={{ display: 'grid', gridGap: 8, padding: 50, whiteSpace: 'nowrap', gridTemplateColumns: '100%' }}
		>
			<div>
				<AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
			</div>

			<div style={{ width: 200 }}>
				<AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
			</div>

			<div style={{ display: 'flex', width: 320 }}>
				Messages from 
				<AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
				 address
			</div>

			<div style={{ display: 'flex' }}>
				Messages from 
				<AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
				 address
			</div>

			<div style={{ display: 'grid', gridAutoFlow: 'column', gridGap: 8, justifyContent: 'start' }}>
				Messages from <AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" /> address
			</div>

			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<div>left</div>
				<AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
			</div>

			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<div>left</div>
				<div style={{ display: 'grid', gridAutoFlow: 'column', gridGap: 8 }}>
					Messages from <AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
				</div>
			</div>

			<div style={{ display: 'flex', justifyContent: 'space-between', width: 200 }}>
				<div>left</div>
				<AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
			</div>

			<div style={{ display: 'flex', justifyContent: 'space-between', width: 320 }}>
				<div>left</div>
				<div style={{ display: 'grid', gridAutoFlow: 'column', gridGap: 8 }}>
					Messages from <AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
				</div>
			</div>

			<div style={{ display: 'flex', fontSize: '300%' }}>
				<b>Inbox </b>
				<div style={{ display: 'flex', minWidth: 0 }}>
					from 
					<AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
				</div>
			</div>
		</div>
	);
});
