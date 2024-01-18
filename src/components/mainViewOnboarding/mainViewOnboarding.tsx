import { observer } from 'mobx-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';

import { FeedManagerApi } from '../../api/feedManagerApi';
import { APP_NAME } from '../../constants';
import { analytics } from '../../stores/Analytics';
import { browserStorage } from '../../stores/browserStorage';
import domain from '../../stores/Domain';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { invariant } from '../../utils/assert';
import { asyncDelay } from '../../utils/asyncDelay';
import { addressesEqual } from '../../utils/blockchain';
import { isPaid, isTrialActive } from '../../utils/payments';
import { useLatest } from '../../utils/useLatest';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { CoverageModal } from '../coverageModal/coverageModal';
import { LoadingModal } from '../loadingModal/loadingModal';
import { toast } from '../toast/toast';

// <IosInstallPwaPopup />

export interface AuthorizeAccountFlowProps {
	address: string;
	onClose: (account?: DomainAccount) => void;
}

export const AuthorizeAccountFlow = observer(({ address, onClose }: AuthorizeAccountFlowProps) => {
	const onCloseRef = useLatest(onClose);

	useEffect(() => {
		(async () => {
			try {
				const timestamp = Math.floor(Date.now() / 1000);
				analytics.mainviewOnboardingEvent('request-signature');
				let signature;
				try {
					signature = await domain._signMessageAsync({
						message: `Mainview auth for address ${address}, timestamp: ${timestamp}`,
					});
				} catch (e) {
					analytics.mainviewOnboardingEvent('signature-reject');
					throw e;
				}
				const { token } = await FeedManagerApi.authAddress(
					{ address, timestamp, signature },
					browserStorage.referrer,
				);
				if (token) {
					browserStorage.mainViewKeys = {
						...browserStorage.mainViewKeys,
						[address]: token,
					};
					analytics.mainviewOnboardingEvent('account-authorized');
					onCloseRef.current(new DomainAccount(address, token));
				} else {
					onCloseRef.current();
				}
			} catch (e) {
				analytics.mainviewOnboardingEvent('authorization-error');
				onCloseRef.current();
			}
		})();
	}, [address, onCloseRef]);

	return <LoadingModal reason="Authorization ..." />;
});

export interface BuildFeedFlowProps {
	account: DomainAccount;
	onClose: (result: boolean) => void;
}

export const BuildFeedFlow = observer(({ account, onClose }: BuildFeedFlowProps) => {
	const onCloseRef = useLatest(onClose);
	const coverage = domain.feedSettings.coverages.get(account);

	useEffect(() => {
		(async () => {
			try {
				const token = account.mainviewKey;

				console.log('account.mainviewKey: ', account.mainviewKey);
				invariant(token, 'No main view key');

				const res = await FeedManagerApi.init(token, undefined);

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

				analytics.mainviewOnboardingEvent('feed-initialized');
			} catch (e) {
				console.error(e);
				analytics.mainviewOnboardingEvent('feed-initialization-error');
				onCloseRef.current(false);
			}
		})();
	}, [account, onCloseRef]);

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

enum StepType {
	PAYMENT = 'PAYMENT',
	PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
	PAYMENT_FAILURE = 'PAYMENT_FAILURE',
	BUILDING_FEED = 'BUILDING_FEED',
	FATAL_ERROR = 'FATAL_ERROR',
}

interface PaymentStep {
	type: StepType.PAYMENT;
	account: DomainAccount;
}

interface PaymentSuccessStep {
	type: StepType.PAYMENT_SUCCESS;
	account: DomainAccount;
}

interface PaymentFailureStep {
	type: StepType.PAYMENT_FAILURE;
	account: DomainAccount;
}

interface BuildingFeedStep {
	type: StepType.BUILDING_FEED;
	account: DomainAccount;
}

interface FatalErrorStep {
	type: StepType.FATAL_ERROR;
}

type Step = PaymentStep | PaymentSuccessStep | PaymentFailureStep | BuildingFeedStep | FatalErrorStep;

export const MainViewOnboarding = observer(({ onResolve }: { onResolve?: (account: DomainAccount) => void }) => {
	const [step, setStep] = useState<Step>();
	const [searchParams] = useSearchParams();

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const accounts = useMemo(() => (domain.account ? [domain.account] : []), [domain.account]);

	const paymentInfoQuery = useQuery(
		['payments', 'info', 'all-accounts', accounts.map(a => a.mainviewKey).join(',')],
		() =>
			Promise.all(
				accounts.map(a =>
					FeedManagerApi.getAccountPlan({ token: a.mainviewKey })
						.then(info => ({
							address: a.address,
							isTrialActive: isTrialActive(info),
							isPaid: isPaid(info),
						}))
						.catch(e => {
							console.error('Failed to load payment info', e);

							// Skip failed requests. Do nothing about it
							return undefined;
						}),
				),
			),
	);

	const reset = useCallback(
		(acc: DomainAccount | undefined) => {
			setStep(undefined);
			if (acc && onResolve) {
				onResolve(acc);
			}
		},
		[onResolve],
	);

	// Save referrer
	useEffect(() => {
		const referrer = searchParams.get('referrer');
		if (referrer) {
			browserStorage.referrer = referrer;
		}
	}, [searchParams]);

	// Launch onboarding
	useEffect(() => {
		// Do nothing if something is happening already
		if (step) return;

		const unpaidAccount = accounts.find(a =>
			paymentInfoQuery.data?.some(
				info => info && addressesEqual(info.address, a.address) && !info.isPaid && !info.isTrialActive,
			),
		);

		if (unpaidAccount) {
			return setStep({ type: StepType.PAYMENT, account: unpaidAccount });
		}
	}, [accounts, paymentInfoQuery.data, reset, step]);

	return (
		<>
			{step && <LoadingModal />}

			{/* {step?.type === StepType.PAYMENT && (
				<PaymentFlow
					account={step.account}
					onPaid={() => setStep({ type: StepType.BUILDING_FEED, account: step.account })}
					onCancel={async () => {
						await disconnectAccount({ place: 'mv-onboarding_payments' });
					}}
				/>
			)}

			{step?.type === StepType.PAYMENT_SUCCESS && (
				<PaymentSuccessFlow
					account={step.account}
					onClose={isPaid => {
						if (isPaid) {
							setStep({ type: StepType.BUILDING_FEED, account: step.account });
						} else {
							setStep({ type: StepType.FATAL_ERROR });
						}
					}}
				/>
			)} */}

			{/* {step?.type === StepType.PAYMENT_FAILURE && (
				<ActionModal
					title="Payment Failed"
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.HEAVY}
							onClick={() => setStep({ type: StepType.PAYMENT, account: step.account })}
						>
							Go Back
						</ActionButton>
					}
				>
					Your payment was not processed.
				</ActionModal>
			)} */}

			{step?.type === StepType.BUILDING_FEED && (
				<BuildFeedFlow
					account={step.account}
					onClose={result => {
						if (result) {
							toast(`Welcome to ${APP_NAME} 🔥`);
						} else {
							setStep({ type: StepType.FATAL_ERROR });
						}

						reset(step.account);
					}}
				/>
			)}

			{step?.type === StepType.FATAL_ERROR && (
				<ActionModal
					title="Oops!"
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.HEAVY}
							onClick={() => location.reload()}
						>
							Reload
						</ActionButton>
					}
				>
					Unexpected error occured. We really don't know what to do 🤷‍♂️ Please try to reload the page.
				</ActionModal>
			)}
		</>
	);
});
