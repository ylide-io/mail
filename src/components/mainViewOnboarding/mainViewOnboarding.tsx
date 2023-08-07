import { observer } from 'mobx-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { FeedManagerApi } from '../../api/feedManagerApi';
import { APP_NAME } from '../../constants';
import domain from '../../stores/Domain';
import { feedSettings } from '../../stores/FeedSettings';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { connectAccount, disconnectAccount } from '../../utils/account';
import { invariant } from '../../utils/assert';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { AdaptiveAddress } from '../adaptiveAddress/adaptiveAddress';
import { TextField } from '../textField/textField';
import { toast } from '../toast/toast';
import css from './mainViewOnboarding.module.scss';
import ErrorCode = FeedManagerApi.ErrorCode;

enum Step {
	CONNECT_ACCOUNT = 'CONNECT_ACCOUNT',
	CONNECT_ACCOUNT_INFO = 'CONNECT_ACCOUNT_INFO',
	ENTER_INVITE_CODE = 'ENTER_INVITE_CODE',
	JOIN_WAITLIST = 'JOIN_WAITLIST',
	SIGN_AUTH = 'SIGN_AUTH',
	BUILDING_FEED = 'BUILDING_FEED',
	SHOW_COVERAGE = 'SHOW_COVERAGE',
}

export const MainViewOnboarding = observer(() => {
	const accounts = domain.accounts.accounts;
	const unathorizedAccount = accounts.find(a => !a.mainViewKey);
	const coverage = feedSettings.coverage;

	const [step, setStep] = useState<Step>();

	const [inviteCode, setInviteCode] = useState('');
	const [inviteCodeLoading, setInviteCodeLoading] = useState(false);
	const divForScriptRef = useRef<HTMLDivElement>(null);

	// Disconnect inactive accounts before begin
	useEffect(() => {
		domain.accounts.accounts
			.filter(a => !a.isAnyLocalPrivateKeyRegistered)
			.forEach(a => disconnectAccount({ account: a }));
	}, []);

	const reset = useCallback(() => {
		setInviteCode('');
		setStep(undefined);
	}, []);

	useEffect(() => {
		if (coverage !== 'loading' && coverage !== 'error' && step === Step.BUILDING_FEED) {
			setStep(Step.SHOW_COVERAGE);
		} else if (coverage === 'error') {
			toast(`Welcome to ${APP_NAME} 🔥`);
			reset();
		}
	}, [coverage, reset, step]);

	const disconnect = useCallback(
		async (account: DomainAccount) => {
			await disconnectAccount({ account });
			reset();
		},
		[reset],
	);

	const authorize = useCallback(
		async (account: DomainAccount, invite?: string) => {
			try {
				async function doAuthorize() {
					setStep(Step.SIGN_AUTH);

					const key = await account.makeMainViewKey();
					invariant(key);

					const { token } = await FeedManagerApi.authAddress(
						account.account.address,
						key.signature,
						key.timestamp,
						invite,
					);

					setStep(Step.BUILDING_FEED);

					await FeedManagerApi.init(token);

					// Update keys after Feed Manager initialized
					account.mainViewKey = token;

					// toast(`Welcome to ${APP_NAME} 🔥`);
					// reset();
				}

				// If just entered invite code, the try to authorize right away
				if (invite) {
					await doAuthorize();
				} else {
					const isActive = await FeedManagerApi.isAddressActive(account.account.address);

					// If account had been authorized already, do it again
					if (isActive) {
						await doAuthorize();
					}
					// Request invide code
					else {
						setStep(Step.JOIN_WAITLIST);
					}
				}
			} catch (e) {
				toast('Unexpected error 🤷‍♂️');
				disconnect(account);
			}
		},
		[disconnect, reset],
	);

	useEffect(() => {
		if (domain.enforceMainViewOnboarding) {
			setStep(Step.JOIN_WAITLIST);
		}
	}, [domain.enforceMainViewOnboarding]);

	useEffect(() => {
		if (step === Step.JOIN_WAITLIST) {
			setTimeout(() => {
				const script = document.createElement('script');
				script.src = 'https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.js';
				divForScriptRef.current?.appendChild(script);
			}, 500);
		}
	}, [step]);

	const connect = useCallback(async () => {
		setStep(Step.CONNECT_ACCOUNT);

		connectAccount({ place: 'mv_onboarding' })
			.then(account => {
				invariant(account);
				authorize(account);
			})
			.catch(() => {
				setStep(Step.CONNECT_ACCOUNT_INFO);
			});
	}, [authorize]);

	const checkInvite = useCallback(async () => {
		const cleanInviteCode = inviteCode.trim();
		if (!cleanInviteCode) {
			setInviteCode('');
			return toast('Please enter your invite code 👀');
		}

		invariant(unathorizedAccount);

		setInviteCodeLoading(true);

		try {
			await FeedManagerApi.checkInvite(cleanInviteCode, unathorizedAccount.account.address);
		} catch (e) {
			if (e instanceof FeedManagerApi.FeedManagerError) {
				if (e.code === ErrorCode.INVALID_INVITE) {
					return toast('Invalid invite code 🤦‍♀️');
				} else if (e.code === ErrorCode.INVALID_ADDRESS) {
					return toast('This invite was already used for another account 👀');
				}
			}

			return toast('Unexpected error 🤷‍♂️');
		} finally {
			setInviteCodeLoading(false);
		}

		authorize(unathorizedAccount, cleanInviteCode);
	}, [authorize, inviteCode, unathorizedAccount]);

	useEffect(() => {
		// Do nothing if something is happening already
		if (step) return;

		if (!accounts.length) {
			connect();
		} else if (unathorizedAccount) {
			authorize(unathorizedAccount);
		}
	}, [accounts, authorize, connect, step, unathorizedAccount]);

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

			{step === Step.JOIN_WAITLIST && (
				<ActionModal
					className={css.modalWide}
					buttons={[
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.LITE}
							isLoading={inviteCodeLoading}
							onClick={() => {
								setStep(Step.ENTER_INVITE_CODE);
							}}
						>
							I already have an invite code
						</ActionButton>,
						unathorizedAccount && (
							<ActionButton
								size={ActionButtonSize.XLARGE}
								look={ActionButtonLook.LITE}
								isDisabled={inviteCodeLoading}
								onClick={() => disconnect(unathorizedAccount)}
							>
								Disconnect this account
							</ActionButton>
						),
					]}
				>
					<div id="getWaitlistContainer" data-waitlist_id="8428"></div>

					<div ref={divForScriptRef} />
				</ActionModal>
			)}

			{step === Step.ENTER_INVITE_CODE && (
				<ActionModal
					title={`Access ${APP_NAME}`}
					buttons={[
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							isLoading={inviteCodeLoading}
							onClick={() => checkInvite()}
						>
							Submit
						</ActionButton>,
						unathorizedAccount && (
							<ActionButton
								size={ActionButtonSize.XLARGE}
								look={ActionButtonLook.LITE}
								isDisabled={inviteCodeLoading}
								onClick={() => disconnect(unathorizedAccount)}
							>
								Disconnect this account
							</ActionButton>
						),
					]}
				>
					<div>
						{APP_NAME} is currently available by invitation only. Please enter the invite code you received
						to unlock access to our personalized crypto news aggregator.
					</div>

					{unathorizedAccount && (
						<div>
							Account:
							<b>
								<AdaptiveAddress address={unathorizedAccount.account.address} />
							</b>
						</div>
					)}

					<TextField
						autoFocus
						disabled={inviteCodeLoading}
						placeholder="Invite code"
						value={inviteCode}
						onValueChange={setInviteCode}
					/>
				</ActionModal>
			)}

			{step === Step.SIGN_AUTH && (
				<ActionModal
					title="Authenticate your wallet"
					buttons={<ActionButton isLoading size={ActionButtonSize.XLARGE} look={ActionButtonLook.PRIMARY} />}
				>
					Please, sign a special string so we can verify that you are the owner of the wallet.
				</ActionModal>
			)}

			{step === Step.BUILDING_FEED && (
				<ActionModal
					title="We're setting up your personalized feed"
					buttons={<ActionButton isLoading size={ActionButtonSize.XLARGE} look={ActionButtonLook.PRIMARY} />}
				>
					We're currently fetching data about your tokens and transactions to create a tailored experience
					just for you. This may take a few moments. Thank you for your patience.
				</ActionModal>
			)}

			{step === Step.SHOW_COVERAGE && coverage !== 'error' && coverage !== 'loading' && (
				<ActionModal
					title="Current coverage of your blockchain activity"
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							onClick={() => {
								toast(`Welcome to ${APP_NAME} 🔥`);
								reset();
							}}
						>
							Close
						</ActionButton>
					}
				>
					<div>We guarantee our users to have a 100% coverage within 3 days from registration date.</div>
					<div>Current results:</div>
					<div>
						Tokens - {coverage.tokens.countCovered} / {coverage.tokens.count} or {coverage.tokens.ratio}%.{' '}
						Dollar value ${coverage.tokens.usdCovered} / {coverage.tokens.usd} or $
						{coverage.tokens.ratioUsd}%.
					</div>
					<div>
						Protocols - {coverage.protocols.countCovered} / {coverage.protocols.count} or{' '}
						{coverage.protocols.ratio}%. Dollar value ${coverage.protocols.usdCovered} /{' '}
						{coverage.protocols.usd} or ${coverage.protocols.ratioUsd}%.
					</div>
				</ActionModal>
			)}
		</>
	);
});
