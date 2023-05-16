import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import { useEffect, useState } from 'react';

import { APP_NAME } from '../../constants';
import domain from '../../stores/Domain';
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
	BUILDING_FEED,
}

export const MainViewOnboarding = observer(() => {
	const [step, setStep] = useState<Step>();

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
					setStep(Step.ENTER_INVITE_CODE);
				})
				.catch(() => {
					setStep(Step.CONNECT_ACCOUNT_INFO);
				});
		}
	}, [step]);

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
							<TextField placeholder="Invite code" />
						</>
					}
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							onClick={() => setStep(Step.BUILDING_FEED)}
						>
							Submit
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
