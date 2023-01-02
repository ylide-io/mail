import { makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';

import modals from '../../stores/Modals';
import YlideModal from '../YlideModal';

export interface PasswordModalProps {
	reason: string;
	onResolve: (value: null | string, remember: boolean, forceNew: boolean) => void;
}

@observer
export default class PasswordModal extends PureComponent<PasswordModalProps> {
	static async show(reason: string): Promise<{ value: string; remember: boolean; forceNew: boolean } | null> {
		return new Promise<{ value: string; remember: boolean; forceNew: boolean } | null>((resolve, reject) => {
			modals.show((close: () => void) => (
				<PasswordModal
					reason={reason}
					onResolve={(val, rem, forceNew) => {
						close();
						resolve(val ? { value: val, remember: rem, forceNew } : null);
					}}
				/>
			));
		});
	}

	@observable value: string = '';
	@observable passwordRepeat: string = '';
	@observable remember = false;
	@observable forgotMode = 0;

	constructor(props: PasswordModalProps) {
		super(props);

		makeObservable(this);
	}

	render() {
		return (
			<YlideModal
				title={
					this.forgotMode === 1 || this.forgotMode === 2
						? 'Forgot password'
						: this.forgotMode === 3
						? 'Create new password'
						: 'Password request'
				}
				subtitle={this.forgotMode ? undefined : `Please, enter your Ylide password to ${this.props.reason}`}
				cancelContent="Cancel"
				confirmContent={
					this.forgotMode === 1
						? "I understand I won't be able to read old messages"
						: this.forgotMode === 2
						? 'I clearly understand the consequences'
						: this.forgotMode === 3
						? 'Create'
						: 'Confirm'
				}
				onCancel={() => this.props.onResolve(null, false, false)}
				onConfirm={() => {
					if (this.forgotMode === 1) {
						this.forgotMode = 2;
					} else if (this.forgotMode === 2) {
						this.forgotMode = 3;
					} else if (this.forgotMode === 3) {
						if (this.value.length < 5) {
							alert('Minimal length is 5 symbols');
							return;
						}
						if (this.value !== this.passwordRepeat) {
							alert(`Passwords don't match`);
							return;
						}
						this.props.onResolve(this.value, false, true);
					} else {
						this.props.onResolve(this.value, this.remember, false);
					}
				}}
			>
				{this.forgotMode === 1 ? (
					<>
						Ylide is a decentralized protocol that stands for privacy and security without any compromises.
						We have no central server where your messages are stored decrypted.
						<br />
						<br />
						Your password is a necessary part of your communication key which is used to decrypt your
						messages. Without your password, it is impossible to decrypt old messages which were written to
						you.
						<br />
						<br />
						You can create a new password and continue using Ylide and receive new messages, but the old
						ones will stay encrypted forever (or until you find your old password).
					</>
				) : this.forgotMode === 2 ? (
					<>
						Sorry, but we have to repeat. If you create a new password - you won't be able to read your old
						messages. You will be able to read only the new ones.
						<br />
						<br />
						However, your recipients will be able to read the messages you've sent to them.
						<br />
						<br />
						Are you sure you want to continue and don't want to try to recall your old password?
					</>
				) : this.forgotMode === 3 ? (
					<>
						This password will be used to encrypt and decrypt your mails.
						<br />
						<br />
						Please save it securely, because if you lose it, you won't be able to access your messages.
						<br />
						<br />
						<b style={{ textAlign: 'center' }}>
							Ylide doesn't save your password anywhere,
							<br />
							and we won't be able to help you recover it.
						</b>
						<br />
						<form
							name="sign-up"
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'stretch',
								justifyContent: 'flex-start',
							}}
							action="/"
							method="POST"
							noValidate
						>
							<input
								className="ylide-input ylide-password-input"
								type="password"
								autoComplete="new-password"
								name="password"
								id="password"
								placeholder="Enter Ylide password"
								value={this.value}
								onChange={e => (this.value = e.target.value)}
							/>
							<input
								className="ylide-input ylide-password-input"
								type="password"
								autoComplete="new-password"
								name="repeat-password"
								id="repeat-password"
								placeholder="Repeat your password"
								value={this.passwordRepeat}
								onChange={e => (this.passwordRepeat = e.target.value)}
							/>
						</form>
					</>
				) : (
					<>
						<input
							style={{
								fontSize: 16,
								borderRadius: 40,
								height: 36,
								border: '1px solid #000000',
								padding: '5px 10px',
								marginLeft: 20,
								marginRight: 20,
								marginTop: 20,
								marginBottom: 20,
							}}
							value={this.value}
							onChange={e => (this.value = e.target.value)}
							type="password"
							placeholder="Enter your Ylide password"
						/>
						<div style={{ textAlign: 'right', marginTop: -10, marginRight: 25 }}>
							<a
								href="#forgot"
								onClick={() => {
									this.forgotMode = 1;
								}}
							>
								Forgot password?
							</a>
						</div>
					</>
				)}
			</YlideModal>
		);
	}
}
