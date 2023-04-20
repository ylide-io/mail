import { useState } from 'react';

import { ActionButtonLook } from '../ActionButton/ActionButton';
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
			description={
				<>
					<p>Please, enter your Ylide password to {reason}</p>

					<TextField
						value={password}
						onValueChange={setPassword}
						type="password"
						placeholder="Enter your Ylide password"
					/>

					<div style={{ textAlign: 'right', marginTop: 8, marginRight: 8 }}>
						<button
							onClick={() =>
								showStaticComponent(resolve => (
									<ForgotPasswordModal
										onClose={password => {
											resolve();
											password && onClose?.(password);
										}}
									/>
								))
							}
						>
							Forgot password?
						</button>
					</div>
				</>
			}
			buttons={[
				{
					title: 'Confirm',
					look: ActionButtonLook.PRIMARY,
					onClick: () => onClose?.(password),
				},
				{
					title: 'Cancel',
					look: ActionButtonLook.LITE,
					onClick: () => onClose?.(),
				},
			]}
		/>
	);
}

export namespace PasswordRequestModal {
	export function show(reason: string) {
		return showStaticComponent<string>(resolve => <PasswordRequestModal reason={reason} onClose={resolve} />);
	}
}
