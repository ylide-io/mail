import clsx from 'clsx';
import { observer } from 'mobx-react';
import { PropsWithChildren, useMemo } from 'react';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../components/ActionButton/ActionButton';
import { AdaptiveAddress } from '../../components/adaptiveAddress/adaptiveAddress';
import { Avatar } from '../../components/avatar/avatar';
import { CheckBox } from '../../components/checkBox/checkBox';
import { Emoji } from '../../components/emoji/emoji';
import { RecipientInput, Recipients } from '../../components/recipientInput/recipientInput';
import { TagInput, TagInputItem } from '../../components/tagInput/tagInput';
import { TextField, TextFieldLook } from '../../components/textField/textField';
import { ReactComponent as SettingsSvg } from '../../icons/ic20/settings.svg';
import css from './testPage.module.scss';

export function Row({ children }: PropsWithChildren) {
	return (
		<div
			style={{
				display: 'flex',
				gap: 8,
				alignItems: 'center',
			}}
		>
			{children}
		</div>
	);
}

//

export const TestPage = observer(() => {
	const recipients = useMemo(() => new Recipients(), []);

	return (
		<div className={css.verticalGrid} style={{ padding: 50 }}>
			<Row>
				content
				<ActionButton>Text Only</ActionButton>
				<ActionButton icon={<SettingsSvg />}>With Icon</ActionButton>
				<ActionButton icon={<SettingsSvg />} />
			</Row>

			<Row>
				href
				<ActionButton>No Href</ActionButton>
				<ActionButton href={'/'}>With Href</ActionButton>
			</Row>

			<Row>
				look
				<ActionButton look={ActionButtonLook.DEFAULT} icon={<SettingsSvg />}>
					DEFAULT
				</ActionButton>
				<ActionButton look={ActionButtonLook.PRIMARY} icon={<SettingsSvg />}>
					PRIMARY
				</ActionButton>
				<ActionButton look={ActionButtonLook.SECONDARY} icon={<SettingsSvg />}>
					SECONDARY
				</ActionButton>
				<ActionButton look={ActionButtonLook.DANGEROUS} icon={<SettingsSvg />}>
					DANGEROUS
				</ActionButton>
				<ActionButton look={ActionButtonLook.LITE} icon={<SettingsSvg />}>
					LITE
				</ActionButton>
				<ActionButton look={ActionButtonLook.SUBTILE} icon={<SettingsSvg />}>
					SUBTILE
				</ActionButton>
				<ActionButton look={ActionButtonLook.HEAVY} icon={<SettingsSvg />}>
					HEAVY
				</ActionButton>
			</Row>

			<Row>
				xsmall
				<ActionButton size={ActionButtonSize.XSMALL}>Text Only</ActionButton>
				<ActionButton size={ActionButtonSize.XSMALL} icon={<SettingsSvg />}>
					With Icon
				</ActionButton>
				<ActionButton size={ActionButtonSize.XSMALL} icon={<SettingsSvg />} />
			</Row>

			<Row>
				small
				<ActionButton size={ActionButtonSize.SMALL}>Text Only</ActionButton>
				<ActionButton size={ActionButtonSize.SMALL} icon={<SettingsSvg />}>
					With Icon
				</ActionButton>
				<ActionButton size={ActionButtonSize.SMALL} icon={<SettingsSvg />} />
			</Row>

			<Row>
				medium
				<ActionButton size={ActionButtonSize.MEDIUM}>Text Only</ActionButton>
				<ActionButton size={ActionButtonSize.MEDIUM} icon={<SettingsSvg />}>
					With Icon
				</ActionButton>
				<ActionButton size={ActionButtonSize.MEDIUM} icon={<SettingsSvg />} />
			</Row>

			<Row>
				large
				<ActionButton size={ActionButtonSize.LARGE}>Text Only</ActionButton>
				<ActionButton size={ActionButtonSize.LARGE} icon={<SettingsSvg style={{ width: 24, height: 24 }} />}>
					With Icon
				</ActionButton>
				<ActionButton size={ActionButtonSize.LARGE} icon={<SettingsSvg style={{ width: 24, height: 24 }} />} />
			</Row>

			<Row>
				xlarge
				<ActionButton size={ActionButtonSize.XLARGE}>Text Only</ActionButton>
				<ActionButton size={ActionButtonSize.XLARGE} icon={<SettingsSvg style={{ width: 24, height: 24 }} />}>
					With Icon
				</ActionButton>
				<ActionButton size={ActionButtonSize.XLARGE} icon={<SettingsSvg style={{ width: 24, height: 24 }} />} />
			</Row>

			<Row>
				multiline
				<ActionButton size={ActionButtonSize.SMALL}>Multiline Small</ActionButton>
				<ActionButton size={ActionButtonSize.MEDIUM}>Multiline Medium</ActionButton>
				<ActionButton size={ActionButtonSize.SMALL}>
					Multiline
					<br />
					Small
				</ActionButton>
				<ActionButton size={ActionButtonSize.MEDIUM}>
					Multiline
					<br />
					Medium
				</ActionButton>
			</Row>

			<Row>
				multiline
				<ActionButton size={ActionButtonSize.SMALL} icon={<SettingsSvg />}>
					Multiline
					<br />
					Small
				</ActionButton>
				<ActionButton size={ActionButtonSize.MEDIUM} icon={<SettingsSvg />}>
					Multiline
					<br />
					Medium
				</ActionButton>
				<ActionButton size={ActionButtonSize.SMALL}>
					Multiline
					<br />
					Small
					<br />
					Button
				</ActionButton>
				<ActionButton size={ActionButtonSize.MEDIUM}>
					Multiline
					<br />
					Medium
					<br />
					Button
				</ActionButton>
			</Row>

			<Row>
				big icon
				<ActionButton size={ActionButtonSize.SMALL} icon={<SettingsSvg style={{ width: 24, height: 24 }} />} />
				<ActionButton size={ActionButtonSize.SMALL} icon={<SettingsSvg style={{ width: 24, height: 24 }} />}>
					With Text
				</ActionButton>
				<ActionButton size={ActionButtonSize.SMALL} icon={<SettingsSvg style={{ width: 36, height: 36 }} />} />
				<ActionButton size={ActionButtonSize.SMALL} icon={<SettingsSvg style={{ width: 36, height: 36 }} />}>
					With Text
				</ActionButton>
			</Row>

			<Row>
				fixed width
				<ActionButton style={{ width: 200 }}>Text Only</ActionButton>
				<ActionButton style={{ width: 200 }} icon={<SettingsSvg />}>
					With Icon
				</ActionButton>
				<ActionButton style={{ width: 200 }} icon={<SettingsSvg />} />
			</Row>

			<Row>
				loading
				<ActionButton isLoading icon={<SettingsSvg />}>
					With Icon
				</ActionButton>
				<ActionButton isLoading size={ActionButtonSize.MEDIUM} look={ActionButtonLook.PRIMARY}>
					Multiline
					<br />
					Medium
					<br />
					Button
				</ActionButton>
			</Row>

			<hr style={{ margin: '32px 0' }} />

			<Row>
				TextField
				<TextField look={TextFieldLook.DEFAULT} placeholder="Default" />
				<TextField look={TextFieldLook.PROMO} placeholder="Promo" />
				<TextField look={TextFieldLook.LITE} placeholder="Lite" />
			</Row>

			<Row>
				error
				<TextField look={TextFieldLook.DEFAULT} isError placeholder="Default" />
				<TextField look={TextFieldLook.PROMO} isError placeholder="Promo" />
				<TextField look={TextFieldLook.LITE} isError placeholder="Lite" />
			</Row>

			<hr style={{ margin: '32px 0' }} />

			<Row>
				TagInput
				<TagInput placeholder="Enter something" />
			</Row>

			<Row>
				TagInput
				<TagInput>
					<TagInputItem>12345678</TagInputItem>
					<TagInputItem>
						<AdaptiveAddress address="0x15a33D60283e3D20751D6740162D1212c1ad2a2d" />
					</TagInputItem>
				</TagInput>
			</Row>

			<hr style={{ margin: '32px 0' }} />

			<Row>
				RecipientInput
				<RecipientInput value={recipients} />
			</Row>

			<hr style={{ margin: '32px 0' }} />

			<Row>
				CheckBox
				<CheckBox isChecked />
				<CheckBox />
			</Row>

			<Row>
				with label
				<CheckBox>Label</CheckBox>
				<CheckBox isChecked>Label</CheckBox>
				<CheckBox isDisabled>Disabled</CheckBox>
				<CheckBox isChecked isDisabled>
					Disabled
				</CheckBox>
			</Row>

			<hr style={{ margin: '32px 0' }} />

			<Row>
				<div style={{ width: '50px' }}>
					<Avatar blockie="asdasd" />
				</div>
				<div style={{ width: '20px' }}>
					<Avatar blockie="asdasd" />
				</div>
			</Row>

			<hr style={{ margin: '32px 0' }} />

			<Row>
				<div style={{ width: '50px' }}>
					<Emoji>😀</Emoji>
				</div>
				<div style={{ width: '20px' }}>
					<Emoji>👍</Emoji>
				</div>
			</Row>

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
