import { TVMWalletController } from '@ylide/everscale';
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
import { toast } from '../toast/toast';

enum Step {
	CONNECT_ACCOUNT_INFO = 'CONNECT_ACCOUNT_INFO',
	BUILDING_FEED = 'BUILDING_FEED',
}

export const MainViewOnboarding = observer(() => {
	const accounts = domain.accounts.accounts;

	const [freshAccount, setFreshAccount] = useState<DomainAccount | null>(null);
	const coverage = freshAccount ? feedSettings.coverages.get(freshAccount) : null;

	const [step, setStep] = useState<Step>();

	// Disconnect inactive accounts before begin
	useEffect(() => {
		domain.accounts.accounts
			.filter(a => !a.isAnyLocalPrivateKeyRegistered)
			.forEach(a => disconnectAccount({ account: a }));
	}, []);

	const reset = useCallback(() => setStep(undefined), []);

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
				const checkInit = async (): Promise<any> => {
					await new Promise(r => setTimeout(() => r(1), 5000));
					const initiated = await FeedManagerApi.checkInit(token);
					if (!initiated) {
						return checkInit();
					}
				};
				if (res?.inLine) {
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

	useEffect(() => {
		if (domain.enforceMainViewOnboarding) {
			authorize(domain.enforceMainViewOnboarding);
		}
	}, [domain.enforceMainViewOnboarding, authorize]);

	const connect = useCallback(async () => {
		connectAccount({ place: 'mv_onboarding' }).catch(() => {
			setStep(Step.CONNECT_ACCOUNT_INFO);
		});
	}, []);

	useEffect(() => {
		// Do nothing if something is happening already
		if (step) return;
		if (!accounts.length) {
			connect();
		}
	}, [accounts, connect, step]);

	return (
		<>
			{step === Step.CONNECT_ACCOUNT_INFO && (
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

			{step === Step.BUILDING_FEED && (coverage === 'loading' || coverage === 'error' || !coverage) && (
				<ActionModal
					title="We're setting up your personalized feed"
					buttons={<ActionButton isLoading size={ActionButtonSize.XLARGE} look={ActionButtonLook.PRIMARY} />}
				>
					We're currently fetching data about your tokens and transactions to create a tailored experience
					just for you. This may take a few moments. Thank you for your patience.
				</ActionModal>
			)}

			{coverage && coverage !== 'loading' && coverage !== 'error' && (
				<CoverageModal
					onClose={() => {
						setFreshAccount(null);
						toast(`Welcome to ${APP_NAME} 🔥`);
						reset();
					}}
					coverage={coverage}
				/>
			)}
		</>
	);
});
