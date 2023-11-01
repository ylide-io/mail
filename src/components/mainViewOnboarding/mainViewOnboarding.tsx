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
import { connectAccount, ConnectAccountResult, disconnectAccount } from '../../utils/account';
import { invariant } from '../../utils/assert';
import { useLatest } from '../../utils/useLatest';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { CoverageModal } from '../coverageModal/coverageModal';
import { IosInstallPwaPopup } from '../iosInstallPwaPopup/iosInstallPwaPopup';
import { LoadingModal } from '../loadingModal/loadingModal';
import { toast } from '../toast/toast';

export interface ConnectAccountFlowProps {
	onClose: (result: ConnectAccountResult | undefined) => void;
}

export const ConnectAccountFlow = observer(({ onClose }: ConnectAccountFlowProps) => {
	const onCloseRef = useLatest(onClose);

	useEffect(() => {
		(async () => {
			try {
				const caResult = await connectAccount({ place: 'mv_onboarding' });
				onCloseRef.current(caResult);
			} catch (e) {
				onCloseRef.current(undefined);
			}
		})();
	}, [onCloseRef]);

	return (
		<>
			<LoadingModal reason="Connecting account ..." />
		</>
	);
});

//

export interface AuthorizeAccountFlowProps {
	account: DomainAccount;
	password: string;
	onClose: (account?: DomainAccount) => void;
}

export const AuthorizeAccountFlow = observer(({ account, password, onClose }: AuthorizeAccountFlowProps) => {
	const onCloseRef = useLatest(onClose);

	useEffect(() => {
		(async () => {
			try {
				const payload = await account.makeMainViewKey(password);
				invariant(payload);
				const { token } = await FeedManagerApi.authAddress(payload);
				account.mainViewKey = token;

				onCloseRef.current(account);
			} catch (e) {
				onCloseRef.current(undefined);
			}
		})();
	}, [account, onCloseRef, password]);

	return (
		<>
			<LoadingModal reason="Authorization ..." />
		</>
	);
});

//

export interface BuildFeedFlowProps {
	account: DomainAccount;
	onClose: (result: boolean) => void;
}

export const BuildFeedFlow = observer(({ account, onClose }: BuildFeedFlowProps) => {
	const coverage = feedSettings.coverages.get(account);

	useEffect(() => {
		(async () => {
			try {
				const token = account.mainViewKey;
				invariant(token, 'No main view key');

				const res = await FeedManagerApi.init(
					token,
					account.wallet.controller instanceof TVMWalletController ? account.wallet.wallet : undefined,
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
			} catch (e) {
				console.error(e);
				onClose(false);
			}
		})();
	}, [account, onClose]);

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
				<CoverageModal coverage={coverage} onClose={() => onClose(true)} />
			)}
		</>
	);
});

//

export const isOnboardingInProgress = observable.box(false);

enum StepType {
	CONNECT_ACCOUNT = 'CONNECT_ACCOUNT',
	CONNECT_ACCOUNT_WARNING = 'CONNECT_ACCOUNT_WARNING',
	AUTHORIZATION = 'AUTHORIZATION',
	BUILDING_FEED = 'BUILDING_FEED',
}

interface ConnectAccountStep {
	type: StepType.CONNECT_ACCOUNT;
}

interface ConnectAccountWarningStep {
	type: StepType.CONNECT_ACCOUNT_WARNING;
}

interface AuthorizationStep {
	type: StepType.AUTHORIZATION;
	account: DomainAccount;
	password: string;
}

interface BuildingFeedStep {
	type: StepType.BUILDING_FEED;
	account: DomainAccount;
}

type Step = ConnectAccountStep | ConnectAccountWarningStep | AuthorizationStep | BuildingFeedStep;

export const MainViewOnboarding = observer(() => {
	const [step, setStep] = useState<Step>();

	const accounts = domain.accounts.accounts;

	const reset = useCallback(() => {
		setStep(undefined);
	}, []);

	const disconnect = useCallback((account: DomainAccount) => disconnectAccount({ account }).then(reset), [reset]);

	useEffect(() => {
		isOnboardingInProgress.set(!!step);
	}, [step]);

	// Disconnect inactive accounts before begin
	useEffect(() => {
		domain.accounts.accounts
			.filter(a => !a.isAnyLocalPrivateKeyRegistered)
			.forEach(a => disconnectAccount({ account: a }));
	}, []);

	useEffect(() => {
		// Do nothing if something is happening already
		if (step) return;

		if (!accounts.length) {
			setStep({ type: StepType.CONNECT_ACCOUNT });
		}
	}, [accounts.length, step]);

	return (
		<>
			{step && <LoadingModal />}

			{step?.type === StepType.CONNECT_ACCOUNT && (
				<ConnectAccountFlow
					onClose={res => {
						if (res?.account) {
							setStep({
								type: StepType.AUTHORIZATION,
								account: res.account,
								password: res.password || '',
							});
						} else {
							setStep({ type: StepType.CONNECT_ACCOUNT_WARNING });
						}
					}}
				/>
			)}

			{step?.type === StepType.CONNECT_ACCOUNT_WARNING && (
				<ActionModal
					title="Connect Account"
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							onClick={() => setStep({ type: StepType.CONNECT_ACCOUNT })}
						>
							Proceed
						</ActionButton>
					}
				>
					You need to connect a crypto wallet in order to use {APP_NAME} 👍
				</ActionModal>
			)}

			{step?.type === StepType.AUTHORIZATION && (
				<AuthorizeAccountFlow
					account={step.account}
					password={step.password}
					onClose={account => {
						if (account) {
							setStep({ type: StepType.BUILDING_FEED, account });
						} else {
							toast('Unexpected error 🤷‍♂️');
							disconnect(step.account);
							reset();
						}
					}}
				/>
			)}

			{step?.type === StepType.BUILDING_FEED && (
				<BuildFeedFlow
					account={step.account}
					onClose={result => {
						if (result) {
							toast(`Welcome to ${APP_NAME} 🔥`);
						} else {
							toast('Unexpected error 🤷‍♂️');
							disconnect(step.account);
						}

						reset();
					}}
				/>
			)}

			{!step && <IosInstallPwaPopup />}
		</>
	);
});
