import { generatePath } from 'react-router-dom';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../components/ActionButton/ActionButton';
import { Modal } from '../../components/modal/modal';
import { createSingletonStaticComponentHook } from '../../components/staticComponentManager/staticComponentManager';
import { APP_NAME } from '../../constants';
import { RoutePath } from '../../stores/routePath';
import { useNav } from '../../utils/url';

export const useAccountConnectedModal = createSingletonStaticComponentHook<AccountConnectedModalProps>(
	(props, resolve) => (
		<AccountConnectedModal
			{...props}
			onClose={() => {
				resolve();
				props.onClose?.();
			}}
		/>
	),
);

//

interface AccountConnectedModalProps {
	onClose?: () => void;
}

export function AccountConnectedModal({ onClose }: AccountConnectedModalProps) {
	const navigate = useNav();

	return (
		<Modal className="account-modal wallet-modal" onClose={() => onClose?.()}>
			<h3 className="wm-title" style={{ marginTop: 20, marginBottom: 10 }}>
				Your account is ready
			</h3>

			<div className="wm-body">
				<img
					src={require('../../assets/img/success.png')}
					alt="Success"
					style={{ marginLeft: -24, marginRight: -24, marginBottom: 14 }}
				/>
			</div>

			<div className="wm-footer-vertical">
				<ActionButton
					size={ActionButtonSize.LARGE}
					look={ActionButtonLook.PRIMARY}
					onClick={() => {
						onClose?.();
						navigate(generatePath(RoutePath.ROOT));
					}}
				>
					Go to {APP_NAME}
				</ActionButton>
				<ActionButton size={ActionButtonSize.LARGE} onClick={() => onClose?.()}>
					Add one more account
				</ActionButton>
			</div>
		</Modal>
	);
}
