import { IGenericAccount } from '@ylide/sdk';

import { Wallet } from '../../stores/models/Wallet';
import { truncateInMiddle } from '../../utils/string';
import { ActionButtonLook } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';

export enum WalletType {
	REGULAR = 'REGULAR',
	PROXY = 'PROXY',
}

export interface SelectWalletTypeModalProps {
	proxyAccount: {
		wallet: Wallet;
		account: IGenericAccount;
	};
	onClose?: (type?: WalletType) => void;
}

export function SelectWalletTypeModal({ proxyAccount, onClose }: SelectWalletTypeModalProps) {
	return (
		<ActionModal
			title="Connect same account?"
			description={
				<>
					We noticed that you're using Ylide within another application. You can connect the same account as
					the parent application uses – <b>{truncateInMiddle(proxyAccount.account.address, 8, '...')}</b>
					<br />
					<br />
					We recommend connect the same account to get seamless user experience.
				</>
			}
			buttons={[
				{
					title: 'Connect same account',
					look: ActionButtonLook.PRIMARY,
					onClick: () => onClose?.(WalletType.PROXY),
				},
				{
					title: 'Use another one',
					look: ActionButtonLook.LITE,
					onClick: () => onClose?.(WalletType.REGULAR),
				},
			]}
			onClose={() => onClose?.()}
		/>
	);
}
