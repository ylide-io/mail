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
			setStep(Step.ENTER_INVITE_CODE);
		}
	}, [accounts, step]);

	useEffect(() => {
		if (step === Step.CONNECT_ACCOUNT) {
			connectAccount()
				.then(account => {
					invariant(account);
					setStep(Step.ENTER_INVITE_CODE);
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
			const result = await FeedManagerApi.checkInvite(cleanInviteCode);
			invariant(result.success);
		} catch (e) {
			return toast('Invalid invite code 🤦‍♀️');
		} finally {
			setInviteCodeLoading(false);
		}

		// CREATE KEY
		try {
			setStep(Step.SIGN_AUTH);

			const key = await account.makeMainViewKey();
			invariant(key);

			const authResult = await FeedManagerApi.authAddress(
				account.account.address,
				key.signature,
				key.timestamp,
				cleanInviteCode,
			);
			invariant(authResult.success);

			account.mainViewKey = authResult.token;
		} catch (e) {
			return toast('Unexpected error 🤷‍♂️');
		}

		// BUILD FEED
		try {
			setStep(Step.BUILDING_FEED);
			await FeedManagerApi.init(account.mainViewKey);
			toast(`Welcome to ${APP_NAME} 🔥`);
		} catch (e) {
			toast("Couldn't set up your personalized feed 🤦‍♀️");
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
					description="Please, sign special string so we can verify that you are the owner of the wallet."
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
					description="We're currently fetching data about your tokens and transactions to create a tailored experience just for you. This may take a few moments. Thank you for your patience."
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
