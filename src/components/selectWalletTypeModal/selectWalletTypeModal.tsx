import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { Modal } from '../modal/modal';
import css from './selectWalletTypeModal.module.scss';

export enum WalletType {
	REGULAR = 'REGULAR',
	PROXY = 'PROXY',
}

export interface SelectWalletTypeModalProps {
	onClose: (type?: WalletType) => void;
}

export function SelectWalletTypeModal({ onClose }: SelectWalletTypeModalProps) {
	return (
		<Modal className={css.root} onClose={() => onClose()}>
			<div className={css.title}>Select Wallet Type</div>

			<div className={css.description}>
				We noticed that you're using Ylide within another application. You can connect the same wallet as the
				parent application uses. We recommend connect the same account to get seamless user experience.
			</div>

			<div className={css.buttons}>
				<ActionButton
					size={ActionButtonSize.XLARGE}
					look={ActionButtonLook.PRIMARY}
					onClick={() => onClose(WalletType.PROXY)}
				>
					Connect same account
				</ActionButton>

				<ActionButton
					size={ActionButtonSize.XLARGE}
					look={ActionButtonLook.LITE}
					onClick={() => onClose(WalletType.REGULAR)}
				>
					Connect another one
				</ActionButton>
			</div>
		</Modal>
	);
}
