import React from 'react';
import { generatePath } from 'react-router-dom';

import { APP_NAME } from '../../constants';
import { RoutePath } from '../../stores/routePath';
import { connectAccount } from '../../utils/account';
import { useNav } from '../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { Modal } from '../modal/modal';

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
						connectAccount({ place: 'account-connected-modal_add-more' });
					}}
				>
					Add one more account
				</ActionButton>
			</div>
		</Modal>
	);
}
