import { EVM_NAMES, EVMNetwork } from '@ylide/ethereum';
import { asyncDelay, RemotePublicKey, WalletAccount, YlideKeyVersion, YlidePrivateKey } from '@ylide/sdk';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ReactComponent as ProceedToWalletArrowSvg } from '../../assets/proceedTOWalletArrow.svg';
import { analytics } from '../../stores/Analytics';
import domain from '../../stores/Domain';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { Wallet } from '../../stores/models/Wallet';
import { disconnectAccount } from '../../utils/account';
import { assertUnreachable, invariant } from '../../utils/assert';
import { getEvmWalletNetwork } from '../../utils/wallet';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { BlockChainLabel } from '../BlockChainLabel/BlockChainLabel';
import { ForgotPasswordModal } from '../forgotPasswordModal/forgotPasswordModal';
import { LoadingModal } from '../loadingModal/loadingModal';
import { SelectNetworkModal } from '../selectNetworkModal/selectNetworkModal';
import { showStaticComponent } from '../staticComponentManager/staticComponentManager';
import { TextField, TextFieldLook } from '../textField/textField';
import { toast } from '../toast/toast';
import { WalletTag } from '../walletTag/walletTag';
import { YlideLoader } from '../ylideLoader/ylideLoader';

enum Step {
	LOADING,
	ENTER_PASSWORD,
	GENERATE_KEY,
	SELECT_NETWORK,
	PUBLISH_KEY,
	PUBLISHING_KEY,
}

interface NewPasswordModalProps {
	faucetType: null | EVMNetwork.POLYGON | EVMNetwork.GNOSIS | EVMNetwork.FANTOM;
	bonus: boolean;
	wallet: Wallet;
	account: WalletAccount;
	remoteKeys: Record<string, RemotePublicKey | null>;
	waitTxPublishing?: boolean;
	onClose?: (account?: DomainAccount) => void;
}

export function NewPasswordModal({
	faucetType,
	bonus,
	wallet,
	account,
	remoteKeys,
	waitTxPublishing,
	onClose,
}: NewPasswordModalProps) {
	const [searchParams] = useSearchParams();
	const freshestKey: { key: RemotePublicKey; blockchain: string } | undefined = useMemo(
		() =>
			Object.keys(remoteKeys)
				.filter(t => !!remoteKeys[t])
				.map(t => ({
					key: remoteKeys[t]!,
					blockchain: t,
				}))
				.sort((a, b) => b.key.timestamp - a.key.timestamp)[0],
		[remoteKeys],
	);
	const keyVersion = freshestKey?.key.publicKey.keyVersion || 0;
	const isPasswordNeeded = keyVersion === 1 || keyVersion === 2;

	const [step, setStep] = useState(Step.ENTER_PASSWORD);

	const [password, setPassword] = useState('');
	const [forceSecond, setForceSecond] = useState(false);

	const [network, setNetwork] = useState<EVMNetwork>();
	useEffect(() => {
		if (wallet.factory.blockchainGroup === 'evm') {
			getEvmWalletNetwork(wallet).then(setNetwork);
		}
	}, [wallet]);

	const domainAccountRef = useRef<DomainAccount>();

	async function createDomainAccount(wallet: Wallet, account: WalletAccount, privateKey: YlidePrivateKey) {
		const acc = await wallet.createNewDomainAccount(account);
		await acc.addNewLocalPrivateKey(privateKey);
		domainAccountRef.current = acc;
		return acc;
	}

	function exitUnsuccessfully(error?: { message: string; e?: any }) {
		if (error) {
			console.error(error.message, error.e);
			toast(error.message);
		}

		if (domainAccountRef.current) {
			disconnectAccount({ account: domainAccountRef.current }).catch();
		}

		onClose?.();
	}

	async function publishLocalKey(key: YlidePrivateKey) {
		try {
			console.log(`publishLocalKey`);
			setStep(Step.PUBLISH_KEY);

			const account = domainAccountRef.current;
			invariant(account);

			const justPublishedKey = await new Promise<RemotePublicKey | null>((resolve, reject) => {
				let isDone = false;

				asyncDelay(3000).then(() => (!isDone ? setStep(Step.LOADING) : null));

				account.publishPublicKey(key, network).then(() => {
					if (isDone) {
						return;
					}

					domain.ylide.core
						.waitForPublicKey(
							network ? EVM_NAMES[network] : account.wallet.currentBlockchain,
							account.account.address,
							key.publicKey.keyBytes,
						)
						.then(foundKey => {
							if (isDone) {
								return;
							}

							isDone = true;

							resolve(foundKey);
						});
				});

				asyncDelay(3000).then(() =>
				domain.ylide.core
				.waitForPublicKey(
							network ? EVM_NAMES[network] : account.wallet.currentBlockchain,
							account.account.address,
							key.publicKey.keyBytes,
						)
						.then(foundKey => {
							if (isDone) {
								return;
							}
							if (foundKey) {
								isDone = true;
								resolve(foundKey);
							}
						}),
				);
			});

			if (justPublishedKey) {
				await domain.keyRegistry.addRemotePublicKey(justPublishedKey);
				account.reloadKeys();
			}

			analytics.walletRegistered(wallet.wallet, account.account.address);
			onClose?.(account);
		} catch (e) {
			exitUnsuccessfully({ message: 'Transaction was not published. Please, try again', e });
		}
	}

	async function createLocalKey({
		password,
		forceNew,
		withoutPassword,
	}: {
		password: string;
		forceNew?: boolean;
		withoutPassword?: boolean;
	}) {
		setStep(Step.GENERATE_KEY);

		let tempLocalKey: YlidePrivateKey;
		let needToRepublishKey = false;
		try {
			if (withoutPassword) {
				console.log('createLocalKey', 'withoutPassword');
				tempLocalKey = await wallet.constructLocalKeyV3(account);
			} else if (forceNew) {
				console.log('createLocalKey', 'forceNew');
				tempLocalKey = await wallet.constructLocalKeyV2(account, password);
			} else if (freshestKey?.key.publicKey.keyVersion === YlideKeyVersion.INSECURE_KEY_V1) {
				if (freshestKey.blockchain === 'venom-testnet') {
					// strange... I'm not sure Qamon keys work here
					if (forceSecond) {
						console.log('createLocalKey', 'INSECURE_KEY_V1 venom-testnet');
						tempLocalKey = await wallet.constructLocalKeyV1(account, password);
					} else {
						console.log('createLocalKey', 'INSECURE_KEY_V1 venom-testnet');
						tempLocalKey = await wallet.constructLocalKeyV2(account, password);
					}
				} else {
					// strange... I'm not sure Qamon keys work here
					if (forceSecond) {
						console.log('createLocalKey', 'INSECURE_KEY_V2 non-venom');
						tempLocalKey = await wallet.constructLocalKeyV2(account, password);
					} else {
						console.log('createLocalKey', 'INSECURE_KEY_V1 non-venom');
						tempLocalKey = await wallet.constructLocalKeyV1(account, password);
					}
				}
			} else if (freshestKey?.key.publicKey.keyVersion === YlideKeyVersion.KEY_V2) {
				// if user already using password - we should use it too
				console.log('createLocalKey', 'KEY_V2');
				tempLocalKey = await wallet.constructLocalKeyV2(account, password);
			} else if (freshestKey?.key.publicKey.keyVersion === YlideKeyVersion.KEY_V3) {
				// if user is not using password - we should not use it too
				console.log('createLocalKey', 'KEY_V3');
				tempLocalKey = await wallet.constructLocalKeyV3(account);
			} else {
				// user have no key at all - use passwordless version
				console.log('createLocalKey', 'no key');
				tempLocalKey = await wallet.constructLocalKeyV3(account);
			}
		} catch (e) {
			exitUnsuccessfully({ message: 'Failed to create local key 😒', e });
			return;
		}

		setStep(Step.LOADING);

		if (!freshestKey || needToRepublishKey) {
			const domainAccount = await createDomainAccount(wallet, account, tempLocalKey);
			if (faucetType && wallet.factory.blockchainGroup === 'evm') {
				const actualFaucetType = needToRepublishKey ? EVMNetwork.POLYGON : faucetType;

				setStep(Step.GENERATE_KEY);

				const faucetData = await domain.getFaucetSignature(
					domainAccount,
					tempLocalKey.publicKey,
					actualFaucetType,
					searchParams.get('registrar') ? Number(searchParams.get('registrar')) : undefined,
				);

				setStep(Step.LOADING);

				domain.isTxPublishing = true;
				analytics.walletRegistered(wallet.wallet, domainAccount.account.address);
				domain.txChain = actualFaucetType;
				domain.txPlateVisible = true;
				domain.txWithBonus = bonus;

				const promise = domain.publishThroughFaucet(faucetData);

				if (waitTxPublishing) {
					await promise;
				}

				onClose?.(domainAccount);
			} else {
				if (wallet.factory.blockchainGroup === 'evm') {
					setStep(Step.SELECT_NETWORK);
				} else {
					await publishLocalKey(tempLocalKey);
				}
			}
		} else if (freshestKey.key.publicKey.equals(tempLocalKey.publicKey)) {
			await domain.keyRegistry.addRemotePublicKeys(
				Object.values(remoteKeys).filter(it => !!it) as RemotePublicKey[],
			);
			const domainAccount = await createDomainAccount(wallet, account, tempLocalKey);
			analytics.walletConnected(wallet.wallet, account.address);
			onClose?.(domainAccount);
		} else if (forceNew || withoutPassword) {
			await createDomainAccount(wallet, account, tempLocalKey);
			await publishLocalKey(tempLocalKey);
		} else {
			toast('Password is wrong. Please try again ❤');
			setStep(Step.ENTER_PASSWORD);
		}
	}

	async function networkSelect(network: EVMNetwork) {
		setNetwork(network);
		setStep(Step.PUBLISH_KEY);
		await publishLocalKey(domainAccountRef.current!.localPrivateKeys[0]);
	}

	return (
		<>
			{step === Step.LOADING ? (
				<LoadingModal reason="Please wait ..." />
			) : step === Step.ENTER_PASSWORD ? (
				<ActionModal
					title={isPasswordNeeded ? 'Enter password' : 'Sign authorization message'}
					buttons={
						<>
							<ActionButton
								size={ActionButtonSize.XLARGE}
								look={ActionButtonLook.PRIMARY}
								onClick={() => createLocalKey({ password })}
							>
								{isPasswordNeeded ? 'Continue' : 'Sign'}
							</ActionButton>
							<ActionButton size={ActionButtonSize.XLARGE} onClick={() => exitUnsuccessfully()}>
								Cancel
							</ActionButton>
						</>
					}
					onClose={() => exitUnsuccessfully()}
				>
					<WalletTag wallet={wallet.factory.wallet} address={account.address} />

					{freshestKey ? (
						<>
							<div>
								We found your <span onDoubleClick={() => setForceSecond(true)}>key</span> in{' '}
								<BlockChainLabel blockchain={freshestKey.blockchain} /> blockchain.{' '}
								{isPasswordNeeded
									? 'Please, enter your Ylide Password to access it.'
									: 'Please, sign authroization message to access it.'}
								{forceSecond ? ' Magic may happen.' : ''}
							</div>

							{isPasswordNeeded && (
								<div
									style={{
										paddingTop: 40,
										paddingBottom: 40,
									}}
								>
									<TextField
										look={TextFieldLook.PROMO}
										autoFocus
										value={password}
										onValueChange={setPassword}
										type="password"
										placeholder="Enter your Ylide password"
									/>

									<div
										style={{
											marginTop: 8,
											textAlign: 'right',
										}}
									>
										<button
											onClick={() =>
												showStaticComponent(resolve => (
													<ForgotPasswordModal
														onClose={result => {
															if (result?.withoutPassword) {
																createLocalKey({
																	password: '',
																	withoutPassword: true,
																});
															} else if (result?.password) {
																createLocalKey({
																	password: result.password,
																	forceNew: true,
																});
															}

															resolve();
														}}
													/>
												))
											}
										>
											Forgot Password?
										</button>
									</div>
								</div>
							)}
						</>
					) : (
						<div>
							To get your private Ylide communication key, please, press "Sign" button below and sign the
							authorization message in your wallet.
						</div>
					)}
				</ActionModal>
			) : step === Step.GENERATE_KEY ? (
				<ActionModal
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							onClick={() => (isPasswordNeeded ? setStep(Step.ENTER_PASSWORD) : exitUnsuccessfully())}
						>
							Cancel
						</ActionButton>
					}
					onClose={() => exitUnsuccessfully()}
				>
					<WalletTag wallet={wallet.factory.wallet} address={account.address} />

					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-end',
							paddingTop: 40,
							paddingRight: 24,
							paddingBottom: 20,
						}}
					>
						<ProceedToWalletArrowSvg />
					</div>

					<div style={{ textAlign: 'center', fontSize: '180%' }}>Confirm the message</div>

					<div>
						{isPasswordNeeded
							? 'We need you to sign your password so we can generate you a unique communication key.'
							: 'We need you to sign authorization message so we can generate you a unique communication key.'}
					</div>
				</ActionModal>
			) : step === Step.SELECT_NETWORK ? (
				<SelectNetworkModal
					wallet={wallet}
					account={account}
					onClose={network => (network ? networkSelect(network) : exitUnsuccessfully())}
				/>
			) : step === Step.PUBLISH_KEY ? (
				<ActionModal
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							onClick={() =>
								setStep(
									wallet.factory.blockchainGroup === 'evm'
										? Step.SELECT_NETWORK
										: isPasswordNeeded
										? Step.ENTER_PASSWORD
										: Step.GENERATE_KEY,
								)
							}
						>
							Cancel
						</ActionButton>
					}
					onClose={() => exitUnsuccessfully()}
				>
					<WalletTag wallet={wallet.factory.wallet} address={account.address} />

					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-end',
							paddingTop: 40,
							paddingRight: 24,
							paddingBottom: 20,
						}}
					>
						<ProceedToWalletArrowSvg />
					</div>

					<div style={{ textAlign: 'center', fontSize: '180%' }}>Confirm the transaction</div>

					<div>Please sign the transaction in your wallet to publish your unique communication key.</div>
				</ActionModal>
			) : step === Step.PUBLISHING_KEY ? (
				<ActionModal onClose={() => exitUnsuccessfully()}>
					<WalletTag wallet={wallet.factory.wallet} address={account.address} />

					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							paddingTop: 20,
							paddingBottom: 20,
						}}
					>
						<YlideLoader />
					</div>

					<div style={{ textAlign: 'center', fontSize: '180%' }}>Publishing the key</div>

					<div>Please, wait for the transaction to be completed</div>
				</ActionModal>
			) : (
				assertUnreachable(step)
			)}
		</>
	);
}
