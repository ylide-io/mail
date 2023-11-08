import { TVMWalletController } from '@ylide/everscale';
import { asyncDelay } from '@ylide/sdk';
import clsx from 'clsx';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'react-query';

import { FeedManagerApi } from '../../api/feedManagerApi';
import { APP_NAME } from '../../constants';
import domain from '../../stores/Domain';
import { feedSettings } from '../../stores/FeedSettings';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { connectAccount, ConnectAccountResult, disconnectAccount, formatAccountName } from '../../utils/account';
import { invariant } from '../../utils/assert';
import { addressesEqual } from '../../utils/blockchain';
import {
	checkout,
	CheckoutResult,
	getActiveCharges,
	getActiveSubscriptions,
	useCheckoutSearchParams,
} from '../../utils/payments';
import { truncateAddress } from '../../utils/string';
import { useLatest } from '../../utils/useLatest';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { GridRowBox } from '../boxes/boxes';
import { CoverageModal } from '../coverageModal/coverageModal';
import { IosInstallPwaPopup } from '../iosInstallPwaPopup/iosInstallPwaPopup';
import { LoadingModal } from '../loadingModal/loadingModal';
import { Modal } from '../modal/modal';
import { toast } from '../toast/toast';
import css from './mainViewOnboarding.module.scss';

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

	return <LoadingModal reason="Authorization ..." />;
});

//

export interface PaymentFlowProps {
	account: DomainAccount;
	onPaid: () => void;
	onCancel: () => void;
}

export const PaymentFlow = observer(({ account, onPaid, onCancel }: PaymentFlowProps) => {
	const paymentInfoQuery = useQuery(['payments', 'info', 'account', account.mainViewKey], {
		queryFn: async () => {
			const data = await FeedManagerApi.getPaymentInfo({ token: account.mainViewKey });
			return {
				...data,
				isTrialActive: data.status.active,
				isPaid: !!getActiveSubscriptions(data).length || !!getActiveCharges(data).length,
			};
		},
	});

	const checkoutMutation = useMutation({
		mutationFn: (variables: { type: FeedManagerApi.PaymentType }) => checkout(account, variables.type),
		onError: e => {
			console.error(e);
			toast('Failed to open payments page 😟');
		},
	});

	useEffect(() => {
		if (paymentInfoQuery.data?.isPaid) {
			onPaid();
		}
	}, [onPaid, paymentInfoQuery.data?.isPaid]);

	return (
		<>
			{paymentInfoQuery.isLoading || paymentInfoQuery.data?.isPaid ? (
				<LoadingModal reason="Loading payment details ..." />
			) : paymentInfoQuery.data?.isTrialActive ? (
				<ActionModal
					title="Welcome!"
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							onClick={() => onPaid()}
						>
							Continue
						</ActionButton>
					}
				>
					You have <b>free 7-day full access</b> to smart newsfeeds that provide everything important about
					your portfolio. Experience the full power of our product without any limitations and make better
					decisions and deals. Good luck!
				</ActionModal>
			) : paymentInfoQuery.data ? (
				<Modal className={css.payModal}>
					<div className={css.payModalTitle}>Save 50% for 12 months</div>

					<div className={css.payModalDescription}>
						Pick your subscription. Use the special offer to purchase the annual subscription and save 50%.
						Or start a monthly subscription. You can cancel the monthly subscription at any time.
					</div>

					<div className={css.payModalPlans}>
						<div className={css.payModalPlan}>
							<div className={css.payModalPlanTitle}>Monthly subscription</div>
							<div className={css.payModalPrice}>$9/month</div>
							<div className={clsx(css.payModalSubtle, css.payModalAboveCra)}>Cancel anytime</div>
							<ActionButton
								className={css.payModalCra}
								isLoading={
									checkoutMutation.isLoading &&
									checkoutMutation.variables?.type === FeedManagerApi.PaymentType.SUBSCRIPTION
								}
								size={ActionButtonSize.XLARGE}
								look={ActionButtonLook.PRIMARY}
								onClick={() =>
									checkoutMutation.mutate({ type: FeedManagerApi.PaymentType.SUBSCRIPTION })
								}
							>
								Subscribe
							</ActionButton>
						</div>

						<div className={css.payModalPlan}>
							<div className={css.payModalPlanTitle}>Annual Plan</div>
							<GridRowBox>
								<div className={clsx(css.payModalPrice, css.payModalPrice_old)}>$108</div>
								<div className={css.payModalBadge}>50% OFF</div>
							</GridRowBox>
							<div className={clsx(css.payModalPrice, css.payModalAboveCra)}>$54/year</div>
							<ActionButton
								className={css.payModalCra}
								isLoading={
									checkoutMutation.isLoading &&
									checkoutMutation.variables?.type === FeedManagerApi.PaymentType.PAYMENT
								}
								size={ActionButtonSize.XLARGE}
								look={ActionButtonLook.HEAVY}
								onClick={() => checkoutMutation.mutate({ type: FeedManagerApi.PaymentType.PAYMENT })}
							>
								Pay Now
							</ActionButton>
						</div>
					</div>

					<ActionButton
						className={css.payModalDisconnectButton}
						size={ActionButtonSize.MEDIUM}
						look={ActionButtonLook.LITE}
						onClick={onCancel}
					>
						Use another account · {formatAccountName(account)}
					</ActionButton>
				</Modal>
			) : (
				<ActionModal
					title="Failed to fetch payment details 😟"
					buttons={
						<ActionButton
							size={ActionButtonSize.LARGE}
							look={ActionButtonLook.HEAVY}
							onClick={() => paymentInfoQuery.refetch()}
						>
							Try Again
						</ActionButton>
					}
				/>
			)}
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
	PAYMENT = 'PAYMENT',
	PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
	PAYMENT_FAILURE = 'PAYMENT_FAILURE',
	BUILDING_FEED = 'BUILDING_FEED',
	FATAL_ERROR = 'FATAL_ERROR',
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

type Step =
	| ConnectAccountStep
	| ConnectAccountWarningStep
	| AuthorizationStep
	| PaymentStep
	| PaymentSuccessStep
	| PaymentFailureStep
	| BuildingFeedStep
	| FatalErrorStep;

export const MainViewOnboarding = observer(() => {
	const [step, setStep] = useState<Step>();
	isOnboardingInProgress.set(!!step);

	const accounts = domain.accounts.accounts;
	const checkoutSearchParams = useCheckoutSearchParams();

	const paymentInfoQuery = useQuery(
		['payments', 'info', 'all-accounts', accounts.map(a => a.mainViewKey).join(',')],
		() =>
			Promise.all(
				accounts.map(a =>
					FeedManagerApi.getPaymentInfo({ token: a.mainViewKey })
						.then(info => ({
							address: a.account.address,
							isTrialActive: info.status.active,
							isPaid: !!getActiveSubscriptions(info).length || !!getActiveCharges(info).length,
						}))
						.catch(e => {
							console.error('Failed to load payment info', e);

							// Skip failed requests. Do nothing about it
							return undefined;
						}),
				),
			),
	);

	const reset = useCallback(() => {
		setStep(undefined);
	}, []);

	// Disconnect inactive accounts before begin
	useEffect(() => {
		domain.accounts.accounts
			.filter(a => !a.isAnyLocalPrivateKeyRegistered)
			.forEach(a => disconnectAccount({ account: a }));
	}, []);

	// Launch onboarding
	useEffect(() => {
		// Do nothing if something is happening already
		if (step) return;

		if (!accounts.length) {
			return setStep({ type: StepType.CONNECT_ACCOUNT });
		}

		const unauthAccount = accounts.find(a => !a.mainViewKey);
		if (unauthAccount) {
			setStep({ type: StepType.AUTHORIZATION, account: unauthAccount, password: '' });
		}

		if (checkoutSearchParams.result) {
			checkoutSearchParams.reset();

			const account = accounts.find(a => addressesEqual(a.account.address, checkoutSearchParams.address));
			if (!account) {
				toast(
					`Account ${truncateAddress(
						checkoutSearchParams.address,
					)} not connected. Please connect it to proceed.`,
				);
				return reset();
			}

			if (checkoutSearchParams.result === CheckoutResult.SUCCESS) {
				return setStep({ type: StepType.PAYMENT_SUCCESS, account });
			} else {
				return setStep({ type: StepType.PAYMENT_FAILURE, account });
			}
		}

		const unpaidAccount = accounts.find(a =>
			paymentInfoQuery.data?.some(
				info => info && addressesEqual(info.address, a.account.address) && !info.isPaid && !info.isTrialActive,
			),
		);
		if (unpaidAccount) {
			return setStep({ type: StepType.PAYMENT, account: unpaidAccount });
		}
	}, [accounts, checkoutSearchParams, paymentInfoQuery.data, reset, step]);

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
						} else if (!accounts.length) {
							setStep({ type: StepType.CONNECT_ACCOUNT_WARNING });
						} else {
							reset();
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
							setStep({ type: StepType.PAYMENT, account });
						} else {
							setStep({ type: StepType.FATAL_ERROR });
						}
					}}
				/>
			)}

			{step?.type === StepType.PAYMENT && (
				<PaymentFlow
					account={step.account}
					onPaid={() => setStep({ type: StepType.BUILDING_FEED, account: step.account })}
					onCancel={async () => {
						await disconnectAccount({ account: step.account, place: 'mv-onboarding_payments' });
						setStep({ type: StepType.CONNECT_ACCOUNT });
					}}
				/>
			)}

			{step?.type === StepType.PAYMENT_SUCCESS && (
				<ActionModal
					title="Payment Successful"
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							onClick={() => setStep({ type: StepType.BUILDING_FEED, account: step.account })}
						>
							Continue
						</ActionButton>
					}
				>
					Your payment has been successfully processed.
				</ActionModal>
			)}

			{step?.type === StepType.PAYMENT_FAILURE && (
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
			)}

			{step?.type === StepType.BUILDING_FEED && (
				<BuildFeedFlow
					account={step.account}
					onClose={result => {
						if (result) {
							toast(`Welcome to ${APP_NAME} 🔥`);
						} else {
							setStep({ type: StepType.FATAL_ERROR });
						}

						reset();
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

			{!step && <IosInstallPwaPopup />}
		</>
	);
});
