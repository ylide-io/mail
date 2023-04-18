import React from 'react';
import { generatePath } from 'react-router-dom';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../components/ActionButton/ActionButton';
import { Modal } from '../../components/modal/modal';
import { showStaticComponent } from '../../components/staticComponentManager/staticComponentManager';
import { APP_NAME } from '../../constants';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { RoutePath } from '../../stores/routePath';
import { useNav } from '../../utils/url';
import { SelectWalletModal } from '../SelectWalletModal';

interface AccountConnectedModalProps {
	onClose?: () => void;
}

export function AccountConnectedModal({ onClose }: AccountConnectedModalProps) {
	const navigate = useNav();

	return (
		<Modal className="account-modal wallet-modal" onClose={onClose}>
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

						showStaticComponent<DomainAccount>(resolve => <SelectWalletModal onClose={resolve} />);
					}}
				>
					Add one more account
				</ActionButton>
			</div>
		</Modal>
	);
}
