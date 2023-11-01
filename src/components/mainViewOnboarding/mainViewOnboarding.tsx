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

export interface ConnectAccountFlowProps {
	onClose: (account: ConnectAccountResult | undefined) => void;
}

export const ConnectAccountFlow = observer(({ onClose }: ConnectAccountFlowProps) => {
	const onCloseRef = useLatest(onClose);

	useEffect(() => {
		connectAccount({ place: 'mv_onboarding' })
			.then(res => onCloseRef.current(res))
			.catch(() => onCloseRef.current(undefined));
	}, [onCloseRef]);

	return <></>;
});

//

export const isOnboardingInProgress = observable.box(false);

enum Step {
	CONNECT_ACCOUNT = 'CONNECT_ACCOUNT',
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
		async ({ account, password }: { account: DomainAccount; password: string }) => {
			try {
				setStep(Step.BUILDING_FEED);

				const payload = await account.makeMainViewKey(password);
				invariant(payload);
				const { token } = await FeedManagerApi.authAddress(payload);

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

				account.mainViewKey = token;
				setFreshAccount(account);
			} catch (e) {
				console.error(e);
				toast('Unexpected error 🤷‍♂️');
				disconnect(account);
			}
		},
		[disconnect],
	);

	useEffect(() => {
		// Do nothing if something is happening already
		if (step) return;

		if (!accounts.length) {
			setStep(Step.CONNECT_ACCOUNT);
		}
	}, [accounts.length, step]);

	return (
		<>
			{step && <LoadingModal />}

			{step === Step.CONNECT_ACCOUNT && (
				<ConnectAccountFlow
					onClose={res => {
						if (res?.account && res.password) {
							authorize({
								account: res.account,
								password: res.password,
							});
						} else {
							setStep(Step.CONNECT_ACCOUNT_WARNING);
						}
					}}
				/>
			)}

			{step === Step.CONNECT_ACCOUNT_WARNING && (
				<ActionModal
					title="Connect Account"
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							onClick={() => setStep(Step.CONNECT_ACCOUNT)}
						>
							Proceed
						</ActionButton>
					}
				>
					You need to connect a crypto wallet in order to use {APP_NAME} 👍
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
