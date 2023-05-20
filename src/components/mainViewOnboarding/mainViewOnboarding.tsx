import { observer } from 'mobx-react';
import { useCallback, useEffect, useState } from 'react';

import { FeedManagerApi } from '../../api/feedManagerApi';
import { APP_NAME } from '../../constants';
import { useDomainAccounts } from '../../stores/Domain';
import { connectAccount } from '../../utils/account';
import { invariant } from '../../utils/assert';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { Overlay } from '../overlay/overlay';
import { TextField } from '../textField/textField';
import { toast } from '../toast/toast';

enum Step {
	CONNECT_ACCOUNT = 'CONNECT_ACCOUNT',
	CONNECT_ACCOUNT_INFO = 'CONNECT_ACCOUNT_INFO',
	ENTER_INVITE_CODE = 'ENTER_INVITE_CODE',
	SIGN_AUTH = 'SIGN_AUTH',
	BUILDING_FEED = 'BUILDING_FEED',
}

export const MainViewOnboarding = observer(() => {
	const accounts = useDomainAccounts();

	const [step, setStep] = useState<Step>();

	const [inviteCode, setInviteCode] = useState('');
	const [inviteCodeLoading, setInviteCodeLoading] = useState(false);

	useEffect(() => {
		if (step) return;

		if (!accounts.length) {
			setStep(Step.CONNECT_ACCOUNT);
		} else if (!accounts.find(a => a.mainViewKey)) {
			const account = accounts[0];
			FeedManagerApi.isAddressActive(account.account.address)
				.then(isActive => {
					if (isActive) {
						setStep(Step.SIGN_AUTH);
						account
							.makeMainViewKey()
							.then(key => {
								invariant(key);
								return FeedManagerApi.authAddress(
									account.account.address,
									key.signature,
									key.timestamp,
								);
							})
							.then(({ token }) => {
								setStep(Step.BUILDING_FEED);
								return FeedManagerApi.init(token).then(() => token);
							})
							.then(token => {
								// Update keys after Feed Manager initialized
								account.mainViewKey = token;

								toast(`Welcome to ${APP_NAME} 🔥`);
								setStep(undefined);
							})
							.catch(e => {
								toast('Unexpected error 🤷‍♂️');
							});
					} else {
						setStep(Step.ENTER_INVITE_CODE);
					}
				})
				.catch(err => {
					setStep(Step.CONNECT_ACCOUNT);
				});
		}
	}, [accounts, step]);

	useEffect(() => {
		if (step === Step.CONNECT_ACCOUNT) {
			connectAccount()
				.then(account => {
					invariant(account);
					FeedManagerApi.isAddressActive(account.account.address)
						.then(isActive => {
							if (isActive) {
								setStep(Step.SIGN_AUTH);
								account
									.makeMainViewKey()
									.then(key => {
										invariant(key);
										return FeedManagerApi.authAddress(
											account.account.address,
											key.signature,
											key.timestamp,
										);
									})
									.then(({ token }) => {
										setStep(Step.BUILDING_FEED);
										return FeedManagerApi.init(token).then(() => token);
									})
									.then(token => {
										// Update keys after Feed Manager initialized
										account.mainViewKey = token;

										toast(`Welcome to ${APP_NAME} 🔥`);
										setStep(undefined);
									})
									.catch(e => {
										toast('Unexpected error 🤷‍♂️');
									});
							} else {
								setStep(Step.ENTER_INVITE_CODE);
							}
						})
						.catch(err => {
							setStep(Step.CONNECT_ACCOUNT);
						});
				})
				.catch(() => {
					setStep(Step.CONNECT_ACCOUNT_INFO);
				});
		}
	}, [step]);

	const checkInviteCode = useCallback(async () => {
		const cleanInviteCode = inviteCode.trim();
		if (!cleanInviteCode) {
			return toast('Please enter your invite code 👀');
		}

		const account = accounts[0];
		if (!account) {
			setStep(Step.CONNECT_ACCOUNT);
			return toast('You need to connect an account first');
		}

		// CHECK INVITE CODE
		try {
			setInviteCodeLoading(true);
			await FeedManagerApi.checkInvite(cleanInviteCode, account.account.address);
		} catch (e) {
			return toast('Invalid invite code 🤦‍♀️');
		} finally {
			setInviteCodeLoading(false);
		}

		setStep(Step.SIGN_AUTH);

		// CREATE KEY & PREPARE FEED
		try {
			const key = await account.makeMainViewKey();

			const { token } = await FeedManagerApi.authAddress(
				account.account.address,
				key.signature,
				key.timestamp,
				cleanInviteCode,
			);

			setStep(Step.BUILDING_FEED);
			await FeedManagerApi.init(token);

			// Update keys after Feed Manager initialized
			account.mainViewKey = token;

			toast(`Welcome to ${APP_NAME} 🔥`);
		} catch (e) {
			return toast('Unexpected error 🤷‍♂️');
		}

		setStep(undefined);
	}, [accounts, inviteCode]);

	return (
		<>
			{step != null && <Overlay isBlur />}

			{step === Step.CONNECT_ACCOUNT_INFO && (
				<ActionModal
					title="Connect Account"
					description={`You need to connect your crypto wallet in order to use ${APP_NAME}`}
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							onClick={() => setStep(Step.CONNECT_ACCOUNT)}
						>
							Proceed
						</ActionButton>
					}
				/>
			)}

			{step === Step.ENTER_INVITE_CODE && (
				<ActionModal
					title={`Access ${APP_NAME}`}
					description={
						<>
							{APP_NAME} is currently available by invitation only. Please enter the invite code you
							received to unlock access to our personalized crypto news aggregator. If you don't have an
							invite code, please join our waiting list to request access.
							<TextField
								autoFocus
								disabled={inviteCodeLoading}
								placeholder="Invite code"
								value={inviteCode}
								onValueChange={setInviteCode}
							/>
						</>
					}
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							isLoading={inviteCodeLoading}
							onClick={() => checkInviteCode()}
						>
							Submit
						</ActionButton>
					}
				/>
			)}

			{step === Step.SIGN_AUTH && (
				<ActionModal
					title="Authenticate your wallet"
					description="Please, sign a special string so we can verify that you are the owner of the wallet."
					buttons={
						<ActionButton
							isLoading
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							onClick={() => setStep(Step.BUILDING_FEED)}
						/>
					}
				/>
			)}

			{step === Step.BUILDING_FEED && (
				<ActionModal
					title="We're setting up your personalized feed"
					description="We're currently fetching data about your tokens and transactions to create a tailored experience just for you. This may take a few moments. Thank you for your patience."
					buttons={
						<ActionButton
							isLoading
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							onClick={() => setStep(Step.BUILDING_FEED)}
						/>
					}
				/>
			)}
		</>
	);
});
