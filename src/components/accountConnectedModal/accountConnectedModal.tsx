import { generatePath } from 'react-router-dom';

import successImage from '../../assets/img/success.png';
import { APP_NAME } from '../../constants';
import { RoutePath } from '../../stores/routePath';
import { connectAccount } from '../../utils/account';
import { useNav } from '../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../actionButton/actionButton';
import { ActionModal } from '../actionModal/actionModal';
import css from './accountConnectedModal.module.scss';

interface AccountConnectedModalProps {
	onClose?: () => void;
}

export function AccountConnectedModal({ onClose }: AccountConnectedModalProps) {
	const navigate = useNav();

	return (
		<ActionModal
			title="Your account is ready 🎉"
			buttons={
				<>
					<ActionButton
						size={ActionButtonSize.XLARGE}
						look={ActionButtonLook.PRIMARY}
						onClick={() => {
							onClose?.();
							navigate(generatePath(RoutePath.ROOT));
						}}
					>
						Go to {APP_NAME}
					</ActionButton>
					<ActionButton
						size={ActionButtonSize.XLARGE}
						onClick={() => {
							onClose?.();
							connectAccount({ place: 'account-connected-modal_add-more' });
						}}
					>
						Add one more account
					</ActionButton>
				</>
			}
			onClose={onClose}
		>
			<div className={css.image}>
				<img src={successImage} alt="Success" />
			</div>
		</ActionModal>
	);
}
