import React, { useState } from 'react';
import { observer } from 'mobx-react';
import { Logo } from '../../icons/Logo';
import { YlideButton } from '../../controls/YlideButton';
import { ArrowRight } from '../../icons/ArrowRight';
import { useNavigate } from 'react-router-dom';
import domain from '../../stores/Domain';

const FirstTimePage = observer(() => {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const [password, setPassword] = useState('');
	const [passwordRepeat, setPasswordRepeat] = useState('');

	let content;
	if (showPassword) {
		content = (
			<>
				<h3 className="intro-title">Create password</h3>
				<p className="intro-subtitle">This password will be used to encrypt and decrypt your mails.</p>
				<br />
				<br />
				<p className="intro-subtitle emphaized">
					Please save it securely, because if you lose it,
					<br />
					you will not be able to access your mail.
					<br />
					<br />
					<b>
						Ylide doesn't save your password anywhere,
						<br />
						and we won't be able to help you recover it.
					</b>
				</p>
				<form name="sign-up" className="sign-up-form" action="/" method="POST" noValidate>
					<input
						className="ylide-input sign-up-input"
						type="password"
						autoComplete="new-password"
						name="password"
						id="password"
						placeholder="Enter Ylide password"
						value={password}
						onChange={e => setPassword(e.target.value)}
					/>
					<input
						className="ylide-input sign-up-input"
						type="password"
						autoComplete="new-password"
						name="repeat-password"
						id="repeat-password"
						placeholder="Repeat your password"
						value={passwordRepeat}
						onChange={e => setPasswordRepeat(e.target.value)}
					/>

					<YlideButton
						type="submit"
						onClick={e => {
							e.preventDefault();
							if (password.length < 5) {
								alert('Minimal length is 5 symbols');
							}
							if (password !== passwordRepeat) {
								alert(`Passwords don't match`);
							}
							domain.savedPassword = password;
							navigate('/connect-wallets?firstTime=true');
						}}
						className="sign-up-submit-button"
					>
						Continue <ArrowRight style={{ marginLeft: 6 }} />
					</YlideButton>
				</form>
			</>
		);
	} else {
		content = (
			<>
				<div className="intro-inner-block">
					<div className="intro-logo">
						<h1 className="logo-name">
							<Logo color="black" />
						</h1>
					</div>
					<h3 className="intro-title">Welcome to Ylide Mail</h3>
					<p className="intro-subtitle">Your gate to the trustless world of communication.</p>
					<br />
					<br />
					<p className="intro-subtitle emphaized">Have you ever used Ylide Mail?</p>
					<br />
					<br />
				</div>
				<div className="intro-buttons">
					<YlideButton onClick={() => navigate('/connect-wallets')}>I've used Ylide before</YlideButton>
					<YlideButton onClick={() => setShowPassword(true)}>It's my first time with Ylide</YlideButton>
				</div>
			</>
		);
	}

	return <div className="intro-page animated fadeInDown">{content}</div>;
});

export default FirstTimePage;
