import clsx from 'clsx';
import { observer } from 'mobx-react';
import React from 'react';

import { ActionButton, ActionButtonSize, ActionButtonStyle } from '../../components/ActionButton/ActionButton';
import { TagInput, TagInputItem } from '../../components/tagInput/tagInput';
import { AdaptiveAddress } from '../../controls/adaptiveAddress/adaptiveAddress';
import { ReactComponent as SettingsSvg } from '../../icons/settings.svg';
import css from './TestPage.module.scss';

export const TestPage = observer(() => {
	return (
		<div className={css.verticalGrid} style={{ padding: 50 }}>
			<div
				style={{
					display: 'grid',
					gridAutoFlow: 'column',
					gridGap: 8,
					alignItems: 'center',
					justifyContent: 'start',
				}}
			>
				content
				<ActionButton>Text Only</ActionButton>
				<ActionButton icon={<SettingsSvg />}>With Icon</ActionButton>
				<ActionButton icon={<SettingsSvg />} />
			</div>

			<div
				style={{
					display: 'grid',
					gridAutoFlow: 'column',
					gridGap: 8,
					alignItems: 'center',
					justifyContent: 'start',
				}}
			>
				style
				<ActionButton style={ActionButtonStyle.Default} icon={<SettingsSvg />}>
					Default
				</ActionButton>
				<ActionButton style={ActionButtonStyle.Primary} icon={<SettingsSvg />}>
					Primary
				</ActionButton>
				<ActionButton style={ActionButtonStyle.Lite} icon={<SettingsSvg />}>
					Lite
				</ActionButton>
				<ActionButton style={ActionButtonStyle.Dengerous} icon={<SettingsSvg />}>
					Dengerous
				</ActionButton>
			</div>

			<div
				style={{
					display: 'grid',
					gridAutoFlow: 'column',
					gridGap: 8,
					alignItems: 'center',
					justifyContent: 'start',
				}}
			>
				small
				<ActionButton size={ActionButtonSize.Small}>Text Only</ActionButton>
				<ActionButton size={ActionButtonSize.Small} icon={<SettingsSvg />}>
					With Icon
				</ActionButton>
				<ActionButton size={ActionButtonSize.Small} icon={<SettingsSvg />} />
			</div>

			<div
				style={{
					display: 'grid',
					gridAutoFlow: 'column',
					gridGap: 8,
					alignItems: 'center',
					justifyContent: 'start',
				}}
			>
				medium
				<ActionButton size={ActionButtonSize.Medium}>Text Only</ActionButton>
				<ActionButton size={ActionButtonSize.Medium} icon={<SettingsSvg />}>
					With Icon
				</ActionButton>
				<ActionButton size={ActionButtonSize.Medium} icon={<SettingsSvg />} />
			</div>

			<div
				style={{
					display: 'grid',
					gridAutoFlow: 'column',
					gridGap: 8,
					alignItems: 'center',
					justifyContent: 'start',
				}}
			>
				multiline
				<ActionButton isMultiline size={ActionButtonSize.Small}>
					Multiline Small
				</ActionButton>
				<ActionButton isMultiline size={ActionButtonSize.Medium}>
					Multiline Medium
				</ActionButton>
				<ActionButton isMultiline size={ActionButtonSize.Small}>
					Multiline
					<br />
					Small
				</ActionButton>
				<ActionButton isMultiline size={ActionButtonSize.Medium}>
					Multiline
					<br />
					Medium
				</ActionButton>
			</div>

			<div
				style={{
					display: 'grid',
					gridAutoFlow: 'column',
					gridGap: 8,
					alignItems: 'center',
					justifyContent: 'start',
				}}
			>
				multiline
				<ActionButton isMultiline size={ActionButtonSize.Small} icon={<SettingsSvg />}>
					Multiline
					<br />
					Small
				</ActionButton>
				<ActionButton isMultiline size={ActionButtonSize.Medium} icon={<SettingsSvg />}>
					Multiline
					<br />
					Medium
				</ActionButton>
				<ActionButton isMultiline size={ActionButtonSize.Small}>
					Multiline
					<br />
					Small
					<br />
					Button
				</ActionButton>
				<ActionButton isMultiline size={ActionButtonSize.Medium}>
					Multiline
					<br />
					Medium
					<br />
					Button
				</ActionButton>
			</div>

			<hr style={{ margin: '32px 0' }} />

			<TagInput placeholder="Enter something" />

			<TagInput>
				<TagInputItem>12345678</TagInputItem>
				<TagInputItem>
					<AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
				</TagInputItem>
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
