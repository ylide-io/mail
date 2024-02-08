import { observer } from 'mobx-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { MainviewApi } from '../../api/mainviewApi';
import { EthereumLogo } from '../../blockchain-icons/EthereumLogo';
import { PolygonLogo } from '../../blockchain-icons/PolygonLogo';
import { ReactComponent as ExternalLinkSvg } from '../../icons/ic20/external.svg';
import domain from '../../stores/Domain';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { formatAccountName } from '../../utils/account';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { LoadingModal } from '../loadingModal/loadingModal';
import { Modal } from '../modal/modal';
import css from './paymentModal.module.scss';

export interface PricingModalProps {
	account: DomainAccount;
	onReserved: (reservation: MainviewApi.TreasuryReservation) => void;
	onReservationFailed: (message?: string) => void;
	onCancel: () => void;
}

/*
<ActionModal
	title="Welcome to Mainview!"
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
	Your free 7-day trial period has started. Utilize full access to the smart news aggregator
	personalized to your crypto holdings. Experience the full power of our product without any
	limitations and master your portfolio to boost your returns.
</ActionModal>
*/

export const PricingModal = observer(({ account, onReserved, onReservationFailed, onCancel }: PricingModalProps) => {
	const [loadingPlanId, setLoadingPlanId] = useState<string | undefined>(undefined);

	const plans = useMemo(
		() => [
			{
				planId: 'month',
				months: 1,
				price: 9,
			},
			{
				planId: 'year',
				months: 12,
				price: 54,
			},
		],
		[],
	);

	const requestReservation = useCallback(
		async (account: DomainAccount, planId: string) => {
			setLoadingPlanId(planId);

			try {
				const reservation = await MainviewApi.payments.buyPlan({
					token: domain.session,
					planId,
					amount: 1,
				});

				onReserved(reservation);
			} catch (err: any) {
				onReservationFailed(err.message);
			}
		},
		[onReserved, onReservationFailed],
	);

	return (
		<>
			<Modal className={css.payModal}>
				<div className={css.payModalTitle}>Save 50% for 12 months</div>

				<div className={css.payModalDescription}>
					Use the special offer to get annual access and save 50% 🔥
				</div>

				<div className={css.payModalPlans}>
					{plans.map(plan => (
						<div key={plan.months} className={css.payModalPlan}>
							<div className={css.payModalPlanTitle}>
								{plan.months} {plan.months === 1 ? 'month' : 'months'}
							</div>
							<div className={css.payModalPrice}>{plan.price} USD</div>
							<div className={css.payModalSubtle}>One-time payment</div>
							<ActionButton
								className={css.payModalCra}
								isLoading={loadingPlanId === plan.planId}
								disabled={loadingPlanId !== undefined}
								size={ActionButtonSize.XLARGE}
								look={ActionButtonLook.PRIMARY}
								onClick={() => requestReservation(account, plan.planId)}
							>
								Pay Now
							</ActionButton>
						</div>
					))}
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
		</>
	);
});

interface PaymentSuccessFlowProps {
	account: DomainAccount;
	onClose: () => void;
}

export function PaymentSuccessFlow({ account, onClose }: PaymentSuccessFlowProps) {
	return (
		<ActionModal
			title="Payment Successful"
			buttons={
				<ActionButton size={ActionButtonSize.XLARGE} look={ActionButtonLook.PRIMARY} onClick={() => onClose()}>
					Continue
				</ActionButton>
			}
		>
			Your payment has been successfully processed. Your account is now active.
		</ActionModal>
	);
}

enum StepType {
	LOADING = 'LOADING',
	PRICING = 'PRICING',
	PAYMENT_INIT_FAILED = 'PAYMENT_INIT_FAILED',
	PAYMENT_WAITING = 'PAYMENT_WAITING',
	PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
	PAYMENT_TIMEOUT = 'PAYMENT_TIMEOUT',
}

interface PaymentLoadingStep {
	type: StepType.LOADING;
	account: DomainAccount;
}

interface PaymentPricingStep {
	type: StepType.PRICING;
	account: DomainAccount;
}

interface PaymentInitFailedStep {
	type: StepType.PAYMENT_INIT_FAILED;
	account: DomainAccount;
	reason: string;
}

interface PaymentWaitingStep {
	type: StepType.PAYMENT_WAITING;
	account: DomainAccount;
	reservation: MainviewApi.TreasuryReservation;
}

interface PaymentSuccessStep {
	type: StepType.PAYMENT_SUCCESS;
	account: DomainAccount;
	reservation: MainviewApi.TreasuryReservation;
	transation: MainviewApi.TreasuryTransaction;
}

interface PaymentTimeoutStep {
	type: StepType.PAYMENT_TIMEOUT;
	account: DomainAccount;
	reservation: MainviewApi.TreasuryReservation;
}

type Step =
	| PaymentLoadingStep
	| PaymentPricingStep
	| PaymentInitFailedStep
	| PaymentWaitingStep
	| PaymentSuccessStep
	| PaymentTimeoutStep;

const Timer = ({ until, onDone }: { until: number; onDone: () => void }) => {
	const [timeLeft, setTimeLeft] = useState(until - Math.floor(Date.now() / 1000));

	useEffect(() => {
		const interval = setInterval(() => {
			setTimeLeft(until - Math.floor(Date.now() / 1000));
		}, 1000);

		return () => clearInterval(interval);
	}, [until]);

	const time = Math.max(0, timeLeft);
	const mins = String(Math.floor(time / 60)).padStart(2, '0');
	const secs = String(time % 60).padStart(2, '0');

	useEffect(() => {
		if (time <= 0) {
			onDone();
		}
	}, [time, onDone]);

	return (
		<>
			{mins}:{secs}
		</>
	);
};

export const PaymentModal = observer(({ account, onResolve }: { account: DomainAccount; onResolve?: () => void }) => {
	const [step, setStep] = useState<Step>({
		type: StepType.LOADING,
		account,
	});
	const [accountPlan, setAccountPlan] = useState<MainviewApi.AccountPlan | undefined>(undefined);

	useEffect(() => {
		setStep({
			type: StepType.LOADING,
			account,
		});
		let cancelled = false;
		MainviewApi.payments.getAccountPlan({ token: domain.session }).then(info => {
			if (!cancelled) {
				setAccountPlan(info);
				if (info?.activeReservations.length) {
					setStep({
						type: StepType.PAYMENT_WAITING,
						account,
						reservation: info.activeReservations[0],
					});
				} else {
					setStep({
						type: StepType.PRICING,
						account,
					});
				}
			}
		});
		return () => {
			cancelled = true;
		};
	}, [account]);

	useEffect(() => {
		if (step.type === StepType.PAYMENT_WAITING) {
			let cancelled = false;
			const timer = setInterval(() => {
				MainviewApi.payments.getAccountPlan({ token: domain.session }).then(info => {
					if (cancelled) {
						return;
					}
					if (info && info.plan !== 'none' && info.lastPaidTx) {
						setStep({
							type: StepType.PAYMENT_SUCCESS,
							account,
							reservation: step.reservation,
							transation: info.lastPaidTx,
						});
					} else if (!info || !info.activeReservations.length) {
						setStep({
							type: StepType.PAYMENT_TIMEOUT,
							account,
							reservation: step.reservation,
						});
					}
				});
			}, 5000);
			return () => {
				cancelled = true;
				clearInterval(timer);
			};
		}
	}, [account, step]);

	useEffect(() => {
		if (account.address === domain.account?.address) {
			domain.reloadAccountPlan();
		}
	}, [account, domain.account]);

	return (
		<>
			{step && <LoadingModal />}

			{step.type === StepType.PRICING && (
				<PricingModal
					account={step.account}
					onReserved={reservation =>
						setStep({ type: StepType.PAYMENT_WAITING, account: step.account, reservation })
					}
					onReservationFailed={msg =>
						setStep({
							type: StepType.PAYMENT_INIT_FAILED,
							account: step.account,
							reason: msg || 'Unknown error, please, try again.',
						})
					}
					onCancel={async () => {
						onResolve?.();
					}}
				/>
			)}

			{step.type === StepType.PAYMENT_INIT_FAILED && (
				<ActionModal
					title="Payment Failed"
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.HEAVY}
							onClick={() => setStep({ type: StepType.PRICING, account: step.account })}
						>
							Go Back
						</ActionButton>
					}
				>
					{step.reason}
				</ActionModal>
			)}

			{step.type === StepType.PAYMENT_WAITING && (
				<ActionModal className={css.waitingModal} title="Make a payment">
					<br />
					Please, send <b>{String(step.reservation.plan.totalPrice)} USDT</b> to the following address in the
					next <b>10 minutes</b>:
					<div
						style={{
							marginTop: 30,
							marginBottom: 30,
							fontSize: 16,
							fontFamily: 'monospace',
							color: '#000',
							fontWeight: 'bold',
						}}
					>
						{step.reservation.treasury}
					</div>
					<div style={{ marginTop: 50, marginBottom: 50 }}>
						<span
							style={{
								fontSize: 16,
								lineHeight: '18px',
							}}
						>
							Time left:
						</span>
						<br />
						<span
							style={{
								fontSize: 30,
								lineHeight: '32px',
							}}
						>
							<Timer
								until={step.reservation.end}
								onDone={() =>
									setStep({
										type: StepType.PAYMENT_TIMEOUT,
										account: step.account,
										reservation: step.reservation,
									})
								}
							/>
						</span>
					</div>
					<div className={css.supportedTokensBlock}>
						<div className={css.supportedTokensTitle}>Supported blockchains and tokens</div>
						<div className={css.supportedTokens}>
							<div className={css.blockchain}>
								<div className={css.blockchainTitle}>
									<EthereumLogo /> Ethereum
								</div>
								<div className={css.blockchainTokens}>
									<a
										href="https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7"
										className={css.blockchainToken}
									>
										USDT
										<ExternalLinkSvg />
									</a>
									<a
										href="https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
										className={css.blockchainToken}
									>
										USDC
										<ExternalLinkSvg />
									</a>
									<a
										href="https://etherscan.io/token/0x6b175474e89094c44da98b954eedeac495271d0f"
										className={css.blockchainToken}
									>
										DAI
										<ExternalLinkSvg />
									</a>
								</div>
							</div>
							<div className={css.blockchain}>
								<div className={css.blockchainTitle}>
									<PolygonLogo /> Polygon
								</div>
								<div className={css.blockchainTokens}>
									<a
										href="https://polygonscan.com/token/0xc2132d05d31c914a87c6611c10748aeb04b58e8f"
										className={css.blockchainToken}
									>
										USDT
										<ExternalLinkSvg />
									</a>
									<a
										href="https://polygonscan.com/token/0x2791bca1f2de4661ed88a30c99a7a9449aa84174"
										className={css.blockchainToken}
									>
										USDC
										<ExternalLinkSvg />
									</a>
								</div>
							</div>
							{/* <div className={css.blockchain}>
								<div className={css.blockchainTitle}>
									<GnosisLogo /> Gnosis
								</div>
								<div className={css.blockchainTokens}>
									<span className={css.blockchainToken}>xDAI</span>
									<a
										href="https://gnosisscan.io/token/0x4ecaba5870353805a9f068101a40e0f32ed605c6"
										className={css.blockchainToken}
									>
										USDT
										<ExternalLinkSvg />
									</a>
									<a
										href="https://gnosisscan.io/token/0xddafbb505ad214d7b80b1f830fccc89b60fb7a83"
										className={css.blockchainToken}
									>
										USDC
										<ExternalLinkSvg />
									</a>
								</div>
							</div> */}
						</div>
					</div>
				</ActionModal>
			)}

			{step.type === StepType.PAYMENT_SUCCESS && (
				<PaymentSuccessFlow
					account={step.account}
					onClose={async () => {
						onResolve?.();
					}}
				/>
			)}

			{step.type === StepType.PAYMENT_TIMEOUT && (
				<ActionModal
					title="Payment timeout"
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.HEAVY}
							onClick={() => setStep({ type: StepType.PRICING, account: step.account })}
						>
							Go Back
						</ActionButton>
					}
				>
					Your deposit address reservation is timed out. Please, try again.
				</ActionModal>
			)}
		</>
	);
});
