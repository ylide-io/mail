import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { PropsWithChildren } from 'react';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../components/ActionButton/ActionButton';
import { CheckBox } from '../../components/checkBox/checkBox';
import { TagInput, TagInputItem } from '../../components/tagInput/tagInput';
import { TextField, TextFieldLook } from '../../components/textField/textField';
import { AdaptiveAddress } from '../../controls/adaptiveAddress/adaptiveAddress';
import { ReactComponent as SettingsSvg } from '../../icons/ic20/settings.svg';
import css from './TestPage.module.scss';

export function GridRow({ children }: PropsWithChildren) {
	return (
		<div
			style={{
				display: 'grid',
				gridAutoFlow: 'column',
				gridGap: 8,
				alignItems: 'center',
				justifyContent: 'start',
			}}
		>
			{children}
		</div>
	);
}

//

export const TestPage = observer(() => {
	return (
		<div className={css.verticalGrid} style={{ padding: 50 }}>
			<GridRow>
				content
				<ActionButton>Text Only</ActionButton>
				<ActionButton icon={<SettingsSvg />}>With Icon</ActionButton>
				<ActionButton icon={<SettingsSvg />} />
			</GridRow>

			<GridRow>
				look
				<ActionButton look={ActionButtonLook.DEFAULT} icon={<SettingsSvg />}>
					Default
				</ActionButton>
				<ActionButton look={ActionButtonLook.PRIMARY} icon={<SettingsSvg />}>
					Primary
				</ActionButton>
				<ActionButton look={ActionButtonLook.LITE} icon={<SettingsSvg />}>
					Lite
				</ActionButton>
				<ActionButton look={ActionButtonLook.DENGEROUS} icon={<SettingsSvg />}>
					Dengerous
				</ActionButton>
			</GridRow>

			<GridRow>
				small
				<ActionButton size={ActionButtonSize.Small}>Text Only</ActionButton>
				<ActionButton size={ActionButtonSize.Small} icon={<SettingsSvg />}>
					With Icon
				</ActionButton>
				<ActionButton size={ActionButtonSize.Small} icon={<SettingsSvg />} />
			</GridRow>

			<GridRow>
				medium
				<ActionButton size={ActionButtonSize.Medium}>Text Only</ActionButton>
				<ActionButton size={ActionButtonSize.Medium} icon={<SettingsSvg />}>
					With Icon
				</ActionButton>
				<ActionButton size={ActionButtonSize.Medium} icon={<SettingsSvg />} />
			</GridRow>

			<GridRow>
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
			</GridRow>

			<GridRow>
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
			</GridRow>

			<GridRow>
				big icon
				<ActionButton size={ActionButtonSize.Small} icon={<SettingsSvg style={{ width: 28, height: 28 }} />} />
				<ActionButton size={ActionButtonSize.Small} icon={<SettingsSvg style={{ width: 28, height: 28 }} />}>
					With Text
				</ActionButton>
			</GridRow>

			<hr style={{ margin: '32px 0' }} />

			<GridRow>
				TextField
				<TextField look={TextFieldLook.DEFAULT} placeholder="Default" />
				<TextField look={TextFieldLook.PROMO} placeholder="Promo" />
				<TextField look={TextFieldLook.LITE} placeholder="Lite" />
			</GridRow>

			<GridRow>
				error
				<TextField look={TextFieldLook.DEFAULT} isError placeholder="Default" />
				<TextField look={TextFieldLook.PROMO} isError placeholder="Promo" />
				<TextField look={TextFieldLook.LITE} isError placeholder="Lite" />
			</GridRow>

			<hr style={{ margin: '32px 0' }} />

			<GridRow>
				TagInput
				<TagInput placeholder="Enter something" />
			</GridRow>

			<GridRow>
				TagInput
				<TagInput>
					<TagInputItem>12345678</TagInputItem>
					<TagInputItem>
						<AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
					</TagInputItem>
				</TagInput>
			</GridRow>

			<hr style={{ margin: '32px 0' }} />

			<GridRow>
				CheckBox
				<CheckBox isChecked />
				<CheckBox />
			</GridRow>

			<GridRow>
				with label
				<label style={{ display: 'grid', gridAutoFlow: 'column', alignItems: 'center', gridGap: 4 }}>
					<CheckBox isChecked />
					Label
				</label>
			</GridRow>

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
