import { useRef, useState } from 'react';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { CheckBox } from '../checkBox/checkBox';
import { TextField } from '../textField/textField';
import { toast } from '../toast/toast';

enum Step {
	FIRST_WARNING,
	SECOND_WARNING,
	ENTER_PASSWORD,
}

export interface ForgotPasswordModalProps {
	onClose?: (result?: { password?: string; withoutPassword?: boolean }) => void;
}

export function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
	const [step, setStep] = useState(Step.FIRST_WARNING);

	const [password, setPassword] = useState('');
	const [passwordRepeat, setPasswordRepeat] = useState('');
	const passwordRepeatRef = useRef<HTMLInputElement>(null);

	const [withoutPassword, setWithoutPassword] = useState(false);

	function onSave() {
		if (withoutPassword) {
			onClose?.({ withoutPassword: true });
		} else {
			if (password.length < 5) {
				toast('Minimal length is 5 symbols');
			} else if (password !== passwordRepeat) {
				toast(`Passwords don't match`);
			} else {
				onClose?.({ password });
			}
		}
	}

	function toggle(checked: boolean) {
		setWithoutPassword(checked);
	}

	return (
		<ActionModal
			title="Reset Password"
			onClose={onClose}
			buttons={
				step === Step.FIRST_WARNING
					? [
							<ActionButton
								size={ActionButtonSize.LARGE}
								look={ActionButtonLook.DANGEROUS}
								onClick={() => setStep(Step.SECOND_WARNING)}
							>
								I understand I won't be able to read old messages
							</ActionButton>,
							<ActionButton
								size={ActionButtonSize.LARGE}
								look={ActionButtonLook.LITE}
								onClick={() => onClose?.()}
							>
								Cancel
							</ActionButton>,
					  ]
					: step === Step.SECOND_WARNING
					? [
							<ActionButton
								size={ActionButtonSize.LARGE}
								look={ActionButtonLook.DANGEROUS}
								onClick={() => setStep(Step.ENTER_PASSWORD)}
							>
								I clearly understand the consequences
							</ActionButton>,
							<ActionButton
								size={ActionButtonSize.LARGE}
								look={ActionButtonLook.LITE}
								onClick={() => onClose?.()}
							>
								Cancel
							</ActionButton>,
					  ]
					: [
							<ActionButton
								size={ActionButtonSize.LARGE}
								look={ActionButtonLook.PRIMARY}
								onClick={() => onSave()}
							>
								{withoutPassword ? 'Reset Password' : 'Save Password'}
							</ActionButton>,
							<ActionButton
								size={ActionButtonSize.LARGE}
								look={ActionButtonLook.LITE}
								onClick={() => onClose?.()}
							>
								Cancel
							</ActionButton>,
					  ]
			}
		>
			{step === Step.FIRST_WARNING ? (
				<>
					<p>
						Ylide is a decentralized protocol that stands for privacy and security without any compromises.
						We have no central server where your messages are stored decrypted.
					</p>
					<p>
						Your password is a necessary part of your communication key which is used to decrypt your
						messages. Without your password, it is impossible to decrypt old messages which were written to
						you.
					</p>
					<p>
						You can create a new password and continue using Ylide and receive new messages, but the old
						ones will stay encrypted forever (or until you find your old password).
					</p>
				</>
			) : step === Step.SECOND_WARNING ? (
				<>
					<p>
						Sorry, but we have to repeat. If you create a new password - you won't be able to read your old
						messages. You will be able to read only the new ones.
					</p>
					<p>However, your recipients will be able to read the messages you've sent to them.</p>
					<p>Are you sure you want to continue and don't want to try to recall your old password?</p>
				</>
			) : (
				<>
					<p>This password will be used to encrypt and decrypt your mails.</p>
					<p>Please save it securely, because if you lose it, you won't be able to access your messages.</p>

					<div
						style={{
							display: 'grid',
							gridGap: 16,
							padding: 16,
						}}
					>
						<TextField
							autoFocus
							type="password"
							placeholder="Enter Ylide password"
							value={password}
							disabled={withoutPassword}
							onValueChange={setPassword}
							onEnter={() => passwordRepeatRef.current?.focus()}
						/>

						<TextField
							ref={passwordRepeatRef}
							type="password"
							placeholder="Repeat your password"
							value={passwordRepeat}
							disabled={withoutPassword}
							onValueChange={setPasswordRepeat}
							onEnter={() => onSave()}
						/>

						<CheckBox isChecked={withoutPassword} onChange={toggle}>
							Without password
						</CheckBox>
					</div>

					<p>
						<b style={{ textAlign: 'center' }}>
							Ylide doesn't save your password anywhere,
							<br />
							and we won't be able to help you recover it.
						</b>
					</p>
				</>
			)}
		</ActionModal>
	);
}
