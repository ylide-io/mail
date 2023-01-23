import clsx from 'clsx';
import { observer } from 'mobx-react';
import React from 'react';

import { TagInput } from '../../components/tagInput/tagInput';
import { AdaptiveAddress } from '../../controls/adaptiveAddress/adaptiveAddress';
import css from './TestPage.module.scss';

export const TestPage = observer(() => {
	return (
		<div className={css.verticalGrid} style={{ padding: 50 }}>
			<TagInput placeholder="Enter something" />

			<TagInput>
				<TagInput.Tag>12345678</TagInput.Tag>
				<TagInput.Tag>
					<AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
				</TagInput.Tag>
			</TagInput>

			<hr style={{ margin: '32px 0' }} />

			<div className={clsx(css.verticalGrid, css.noWrap, css.borderedChildren)}>
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
		</div>
	);
});
