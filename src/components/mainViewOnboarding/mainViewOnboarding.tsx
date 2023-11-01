import { TVMWalletController } from '@ylide/everscale';
import { asyncDelay } from '@ylide/sdk';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { useCallback, useEffect, useState } from 'react';

import { FeedManagerApi } from '../../api/feedManagerApi';
import { APP_NAME } from '../../constants';
import domain from '../../stores/Domain';
import { feedSettings } from '../../stores/FeedSettings';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { connectAccount, disconnectAccount } from '../../utils/account';
import { invariant } from '../../utils/assert';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { CoverageModal } from '../coverageModal/coverageModal';
import { IosInstallPwaPopup } from '../iosInstallPwaPopup/iosInstallPwaPopup';
import { toast } from '../toast/toast';

export const isOnboardingInProgress = observable.box(false);

//

export interface BuildFeedFlowProps {
	account: DomainAccount;
	onClose: () => void;
}

export const BuildFeedFlow = observer(({ account, onClose }: BuildFeedFlowProps) => {
	const coverage = feedSettings.coverages.get(account);

	return (
		<>
			{!coverage || coverage === 'loading' || coverage === 'error' ? (
				<ActionModal
					title="We're setting up your personalized feed"
					buttons={<ActionButton isLoading size={ActionButtonSize.XLARGE} look={ActionButtonLook.PRIMARY} />}
				>
					We're currently fetching data about your tokens and transactions to create a tailored experience
					just for you. This may take a few moments. Thank you for your patience.
				</ActionModal>
			) : (
				<CoverageModal coverage={coverage} onClose={onClose} />
			)}
		</>
	);
});

//

enum Step {
	CONNECT_ACCOUNT_WARNING = 'CONNECT_ACCOUNT_WARNING',
	BUILDING_FEED = 'BUILDING_FEED',
}

export const MainViewOnboarding = observer(() => {
	const [step, setStep] = useState<Step>();

	useEffect(() => {
		isOnboardingInProgress.set(!!step);
	}, [step]);

	const accounts = domain.accounts.accounts;
	const [freshAccount, setFreshAccount] = useState<DomainAccount>();

	// Disconnect inactive accounts before begin
	useEffect(() => {
		domain.accounts.accounts
			.filter(a => !a.isAnyLocalPrivateKeyRegistered)
			.forEach(a => disconnectAccount({ account: a }));
	}, []);

	const reset = useCallback(() => {
		setFreshAccount(undefined);
		setStep(undefined);
	}, []);

	const disconnect = useCallback((account: DomainAccount) => disconnectAccount({ account }).then(reset), [reset]);

	const authorize = useCallback(
		async ({ domainAccount, password }: { domainAccount: DomainAccount; password: string }) => {
			try {
				setStep(Step.BUILDING_FEED);

				const payload = await domainAccount.makeMainViewKey(password);
				invariant(payload);
				const { token } = await FeedManagerApi.authAddress(payload);

				const res = await FeedManagerApi.init(
					token,
					domainAccount.wallet.controller instanceof TVMWalletController
						? domainAccount.wallet.wallet
						: undefined,
				);

				if (res?.inLine) {
					async function checkInit() {
						await asyncDelay(5000);
						const initiated = await FeedManagerApi.checkInit(token);
						if (!initiated) {
							await checkInit();
						}
					}

					await checkInit();
				}

				domainAccount.mainViewKey = token;
				setFreshAccount(domainAccount);
			} catch (e) {
				console.log(e);
				toast('Unexpected error 🤷‍♂️');
				disconnect(domainAccount);
			}
		},
		[disconnect],
	);

	const enforceMainViewOnboarding = domain.enforceMainViewOnboarding;

	useEffect(() => {
		if (enforceMainViewOnboarding) {
			authorize(enforceMainViewOnboarding);
		}
	}, [enforceMainViewOnboarding, authorize]);

	const connect = useCallback(async () => {
		const newAccount = await connectAccount({ place: 'mv_onboarding' });
		if (!newAccount && !accounts.length) {
			setStep(Step.CONNECT_ACCOUNT_WARNING);
		}
	}, [accounts]);

	useEffect(() => {
		// Do nothing if something is happening already
		if (step) return;

		if (!accounts.length) {
			connect();
		}
	}, [accounts, connect, step]);

	return (
		<>
			{step === Step.CONNECT_ACCOUNT_WARNING && (
				<ActionModal
					title="Connect Account"
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							onClick={() => connect()}
						>
							Proceed
						</ActionButton>
					}
				>
					You need to connect a crypto wallet in order to use {APP_NAME}
				</ActionModal>
			)}

			{step === Step.BUILDING_FEED && (
				<BuildFeedFlow
					account={freshAccount!}
					onClose={() => {
						toast(`Welcome to ${APP_NAME} 🔥`);
						reset();
					}}
				/>
			)}

			{!step && <IosInstallPwaPopup />}
		</>
	);
});
