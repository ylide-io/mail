import { useState } from 'react';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../actionButton/actionButton';
import { ActionModal } from '../actionModal/actionModal';
import { ForgotPasswordModal } from '../forgotPasswordModal/forgotPasswordModal';
import { showStaticComponent } from '../staticComponentManager/staticComponentManager';
import { TextField } from '../textField/textField';

export interface PasswordRequestModalProps {
	reason: string;
	onClose?: (password?: string) => void;
}

export function PasswordRequestModal({ reason, onClose }: PasswordRequestModalProps) {
	const [password, setPassword] = useState('');

	return (
		<ActionModal
			title="Password request"
			buttons={[
				<ActionButton
					size={ActionButtonSize.XLARGE}
					look={ActionButtonLook.PRIMARY}
					onClick={() => onClose?.(password)}
				>
					Confirm
				</ActionButton>,
				<ActionButton size={ActionButtonSize.XLARGE} look={ActionButtonLook.LITE} onClick={() => onClose?.()}>
					Cancel
				</ActionButton>,
			]}
		>
			<p>Please, enter your Ylide password to {reason}</p>

			<TextField
				type="password"
				placeholder="Enter your Ylide password"
				value={password}
				onValueChange={setPassword}
				onEnter={() => onClose?.(password)}
			/>

			<div style={{ textAlign: 'right', marginTop: 8, marginRight: 8 }}>
				<button
					onClick={() =>
						showStaticComponent(resolve => (
							<ForgotPasswordModal
								onClose={result => {
									resolve();
									onClose?.(result?.password);
								}}
							/>
						))
					}
				>
					Forgot password?
				</button>
			</div>
		</ActionModal>
	);
}

export namespace PasswordRequestModal {
	export function show(reason: string) {
		return showStaticComponent<string>(resolve => <PasswordRequestModal reason={reason} onClose={resolve} />);
	}
}
