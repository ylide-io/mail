import { observer } from 'mobx-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FeedManagerApi } from '../../api/feedManagerApi';
import { APP_NAME } from '../../constants';
import domain from '../../stores/Domain';
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

import { CoverageModal } from '../coverageModal/coverageModal';

enum Step {
	CONNECT_ACCOUNT = 'CONNECT_ACCOUNT',
	CONNECT_ACCOUNT_INFO = 'CONNECT_ACCOUNT_INFO',
	ENTER_INVITE_CODE = 'ENTER_INVITE_CODE',
	JOIN_WAITLIST = 'JOIN_WAITLIST',
	SIGN_AUTH = 'SIGN_AUTH',
	BUILDING_FEED = 'BUILDING_FEED',
}

export const MainViewOnboarding = observer(() => {
	const [searchParams] = useSearchParams();

	const accounts = domain.accounts.accounts;
	const unathorizedAccount = accounts.find(a => !a.mainViewKey);

	const [freshAccount, setFreshAccount] = useState<DomainAccount | null>(null);

	const [step, setStep] = useState<Step>();

	const [inviteCode, setInviteCode] = useState(searchParams.get('invite') || '');
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

					const payload = await account.makeMainViewKey(invite);
					invariant(payload);

					const { token } = await FeedManagerApi.authAddress(payload);

					setStep(Step.BUILDING_FEED);

					await FeedManagerApi.init(token, payload.tvmType);

					// Update keys after Feed Manager initialized
					account.mainViewKey = token;

					setFreshAccount(account);
				}

				// If just entered invite code, the try to authorize right away
				if (invite) {
					await doAuthorize();
				} else {
					const isActive = await FeedManagerApi.isAddressActive(account.account.address);

					// If account had been authorized already, do it again
					if (isActive) {
						await doAuthorize();
						// Request invide code
					} else if (account.isAnyLocalPrivateKeyRegistered) {
						if (searchParams.get('direct') === 'true' || searchParams.get('invite')) {
							setStep(Step.ENTER_INVITE_CODE);
						} else {
							setStep(Step.JOIN_WAITLIST);
						}
					}
				}
			} catch (e) {
				toast('Unexpected error 🤷‍♂️');
				disconnect(account);
			}
		},
		[disconnect, searchParams],
	);

	useEffect(() => {
		if (domain.enforceMainViewOnboarding) {
			if (searchParams.get('direct') === 'true' || searchParams.get('invite')) {
				setStep(Step.ENTER_INVITE_CODE);
			} else {
				setStep(Step.JOIN_WAITLIST);
			}
		}
	}, [domain.enforceMainViewOnboarding, searchParams]);

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

			{freshAccount && (
				<CoverageModal
					onClose={() => {
						setFreshAccount(null);
						toast(`Welcome to ${APP_NAME} 🔥`);
						reset();
					}}
					account={freshAccount}
				/>
			)}
		</>
	);
});
