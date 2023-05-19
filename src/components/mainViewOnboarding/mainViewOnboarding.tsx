import { asyncDelay } from '@ylide/sdk';
import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import { useCallback, useEffect, useState } from 'react';

import { FeedManagerApi } from '../../api/feedManagerApi';
import { APP_NAME } from '../../constants';
import domain from '../../stores/Domain';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { connectAccount } from '../../utils/account';
import { invariant } from '../../utils/assert';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { Overlay } from '../overlay/overlay';
import { Spinner } from '../spinner/spinner';
import { TextField } from '../textField/textField';

enum Step {
	CONNECT_ACCOUNT,
	CONNECT_ACCOUNT_INFO,
	ENTER_INVITE_CODE,
	SIGN_AUTH,
	BUILDING_FEED,
}

export const MainViewOnboarding = observer(() => {
	const [step, setStep] = useState<Step>();
	const [inviteCode, setInviteCode] = useState('');
	const [inviteCodeLoading, setInviteCodeLoading] = useState(false);
	const [tempAccount, setTempAccount] = useState<DomainAccount>();

	useEffect(
		() =>
			autorun(() => {
				setStep(step => (domain.accounts.hasActiveAccounts ? step : Step.CONNECT_ACCOUNT));
			}),
		[],
	);

	useEffect(() => {
		if (step === Step.CONNECT_ACCOUNT) {
			connectAccount()
				.then(account => {
					invariant(account);
					setTempAccount(account);
					setStep(Step.ENTER_INVITE_CODE);
				})
				.catch(() => {
					setStep(Step.CONNECT_ACCOUNT_INFO);
				});
		}
	}, [step]);

	const checkInviteCode = useCallback(
		async (code: string) => {
			invariant(tempAccount);
			setInviteCodeLoading(true);
			try {
				const result = await FeedManagerApi.checkInvite(code);
				if (result.success) {
					setStep(Step.SIGN_AUTH);
					let key: { signature: string; timestamp: number };
					try {
						key = await tempAccount.makeMainViewKey();
					} catch (err) {
						// show error
						setStep(Step.ENTER_INVITE_CODE);
						return;
					}
					invariant(key);
					const authResult = await FeedManagerApi.authAddress(
						tempAccount.account.address,
						key.signature,
						key.timestamp,
						inviteCode,
					);
					if (authResult.success) {
						tempAccount.setMainViewKey(authResult.token);
						setStep(Step.BUILDING_FEED);
						FeedManagerApi.init(tempAccount.mainViewKey)
							.then(({ success }) => {
								setStep(undefined);
							})
							.catch(() => {
								// show error
								setStep(undefined);
							});
					} else {
						// show error
						setStep(Step.ENTER_INVITE_CODE);
						return;
					}
				}
			} catch (err) {
				// show error
				setInviteCodeLoading(false);
				return;
			}
		},
		[inviteCode, tempAccount],
	);

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
								value={inviteCode}
								placeholder="Invite code"
								onChange={e => setInviteCode(e.target.value)}
							/>
						</>
					}
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							isDisabled={inviteCodeLoading}
							onClick={() => checkInviteCode(inviteCode)}
						>
							{inviteCodeLoading ? <Spinner /> : 'Submit'}
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
							isDisabled
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							onClick={() => setStep(Step.BUILDING_FEED)}
						>
							<Spinner />
						</ActionButton>
					}
				/>
			)}

			{step === Step.BUILDING_FEED && (
				<ActionModal
					title="We're setting up your personalized feed"
					description="We're currently fetching data about your tokens and transactions to create a tailored experience just for you. This may take a few moments. Thank you for your patience."
					buttons={
						<ActionButton
							isDisabled
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							onClick={() => setStep(Step.BUILDING_FEED)}
						>
							<Spinner />
						</ActionButton>
					}
				/>
			)}
		</>
	);
});
