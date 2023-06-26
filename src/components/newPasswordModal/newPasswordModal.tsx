import { EVMNetwork } from '@ylide/ethereum';
import { asyncDelay, ExternalYlidePublicKey, IGenericAccount, YlideKeyPair, YlidePublicKeyVersion } from '@ylide/sdk';
import SmartBuffer from '@ylide/smart-buffer';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ReactComponent as ProceedToWalletArrowSvg } from '../../assets/proceedTOWalletArrow.svg';
import { AppMode, REACT_APP__APP_MODE } from '../../env';
import { analytics } from '../../stores/Analytics';
import { browserStorage } from '../../stores/browserStorage';
import domain from '../../stores/Domain';
import { evmBalances } from '../../stores/evmBalances';
import { chainIdByFaucetType, publishKeyThroughFaucet, requestFaucetSignature } from '../../stores/KeyManagement';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { Wallet } from '../../stores/models/Wallet';
import { disconnectAccount } from '../../utils/account';
import { assertUnreachable, invariant } from '../../utils/assert';
import { isBytesEqual } from '../../utils/isBytesEqual';
import { getEvmWalletNetwork } from '../../utils/wallet';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { BlockChainLabel } from '../BlockChainLabel/BlockChainLabel';
import { ErrorMessage, ErrorMessageLook } from '../errorMessage/errorMessage';
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
	faucetType: null | 'polygon' | 'gnosis' | 'fantom';
	bonus: boolean;
	wallet: Wallet;
	account: IGenericAccount;
	remoteKeys: Record<string, ExternalYlidePublicKey | null>;
	onClose?: (account?: DomainAccount) => void;
}

export function NewPasswordModal({ faucetType, bonus, wallet, account, remoteKeys, onClose }: NewPasswordModalProps) {
	const freshestKey: { key: ExternalYlidePublicKey; blockchain: string } | undefined = useMemo(
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

	const keyParams = useMemo(() => {
		if (REACT_APP__APP_MODE === AppMode.MAIN_VIEW) {
			return {
				keyExists: !!freshestKey && freshestKey.key.keyVersion === 3,
				keyVersion: freshestKey && freshestKey.key.keyVersion === 3 ? freshestKey.key.keyVersion : 0,
				isPasswordNeeded: false,
				registrar: freshestKey && freshestKey.key.keyVersion === 3 ? freshestKey.key.registrar : 0,
			};
		}
		return {
			keyExists: !!freshestKey,
			keyVersion: freshestKey ? freshestKey.key.keyVersion : 0,
			isPasswordNeeded: freshestKey
				? freshestKey.key.keyVersion === 1 || freshestKey.key.keyVersion === 2
				: false,
			registrar: freshestKey ? freshestKey.key.registrar : 0,
		};
	}, [freshestKey]);

	const [step, setStep] = useState(Step.ENTER_PASSWORD);

	const [password, setPassword] = useState('');
	const [passwordRepeat, setPasswordRepeat] = useState('');

	const [network, setNetwork] = useState<EVMNetwork>();
	useEffect(() => {
		if (wallet.factory.blockchainGroup === 'evm') {
			getEvmWalletNetwork(wallet).then(setNetwork);
			evmBalances.updateBalances(wallet, account.address);
		}
	}, [account.address, wallet]);

	const domainAccountRef = useRef<DomainAccount>();

	async function createDomainAccount(
		wallet: Wallet,
		account: IGenericAccount,
		keypair: YlideKeyPair,
		keyVersion: YlidePublicKeyVersion,
	) {
		return (domainAccountRef.current = await wallet.instantiateNewAccount(account, keypair, keyVersion));
	}

	function exitUnsuccessfully(error?: { message: string; e?: any }) {
		if (error) {
			console.error(error.message, error.e);
			toast(error.message);
		}

		if (domainAccountRef.current) {
			disconnectAccount(domainAccountRef.current).catch();
		}

		onClose?.();
	}

	async function publishLocalKey() {
		try {
			console.log(`publishLocalKey`);
			setStep(Step.PUBLISH_KEY);

			const account = domainAccountRef.current;
			invariant(account);

			await Promise.all([
				account.attachRemoteKey(network),
				// Display loader after 3 seconds
				asyncDelay(3000).then(() => setStep(Step.LOADING)),
			]);
			await asyncDelay(7000);
			await account.init();
			analytics.walletRegistered(wallet.factory.wallet, account.account.address, domain.accounts.accounts.length);
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

		let tempLocalKey: YlideKeyPair;
		let keyVersion;
		let needToRepublishKey = false;
		try {
			if (REACT_APP__APP_MODE === AppMode.MAIN_VIEW) {
				// in MainView we support only v3 keys
				console.log('createLocalKey');
				tempLocalKey = await wallet.constructLocalKeyV3(account);
				keyVersion = YlidePublicKeyVersion.KEY_V3;
				needToRepublishKey =
					freshestKey?.key.keyVersion === YlidePublicKeyVersion.INSECURE_KEY_V1 ||
					freshestKey?.key.keyVersion === YlidePublicKeyVersion.KEY_V2;
			} else {
				if (withoutPassword) {
					console.log('createLocalKey', 'withoutPassword');
					tempLocalKey = await wallet.constructLocalKeyV3(account);
					keyVersion = YlidePublicKeyVersion.KEY_V3;
				} else if (forceNew) {
					console.log('createLocalKey', 'forceNew');
					tempLocalKey = await wallet.constructLocalKeyV2(account, password);
					keyVersion = YlidePublicKeyVersion.KEY_V2;
				} else if (freshestKey?.key.keyVersion === YlidePublicKeyVersion.INSECURE_KEY_V1) {
					if (freshestKey.blockchain === 'venom-testnet') {
						// strange... I'm not sure Qamon keys work here
						console.log('createLocalKey', 'INSECURE_KEY_V1 venom-testnet');
						tempLocalKey = await wallet.constructLocalKeyV2(account, password);
						keyVersion = YlidePublicKeyVersion.KEY_V2;
					} else {
						// strange... I'm not sure Qamon keys work here
						console.log('createLocalKey', 'INSECURE_KEY_V1');
						tempLocalKey = await wallet.constructLocalKeyV1(account, password);
						keyVersion = YlidePublicKeyVersion.INSECURE_KEY_V1;
					}
				} else if (freshestKey?.key.keyVersion === YlidePublicKeyVersion.KEY_V2) {
					// if user already using password - we should use it too
					console.log('createLocalKey', 'KEY_V2');
					tempLocalKey = await wallet.constructLocalKeyV2(account, password);
					keyVersion = YlidePublicKeyVersion.KEY_V2;
				} else if (freshestKey?.key.keyVersion === YlidePublicKeyVersion.KEY_V3) {
					// if user is not using password - we should not use it too
					console.log('createLocalKey', 'KEY_V3');
					tempLocalKey = await wallet.constructLocalKeyV3(account);
					keyVersion = YlidePublicKeyVersion.KEY_V3;
				} else {
					// user have no key at all - use passwordless version
					console.log('createLocalKey', 'no key');
					tempLocalKey = await wallet.constructLocalKeyV3(account);
					keyVersion = YlidePublicKeyVersion.KEY_V3;
				}
			}
		} catch (e) {
			exitUnsuccessfully({ message: 'Failed to create local key 😒', e });
			return;
		}

		setStep(Step.LOADING);

		if (!freshestKey || needToRepublishKey) {
			const domainAccount = await createDomainAccount(wallet, account, tempLocalKey, keyVersion);
			if (faucetType && wallet.factory.blockchainGroup === 'evm') {
				async function publishThroughFaucet(
					account: DomainAccount,
					keyVersion: number,
					faucetType: 'polygon' | 'gnosis' | 'fantom',
					bonus: boolean,
					doWait: boolean,
				) {
					browserStorage.canSkipRegistration = true;
					console.log('public key: ', '0x' + new SmartBuffer(account.key.keypair.publicKey).toHexString());
					setStep(Step.GENERATE_KEY);
					const chainId = chainIdByFaucetType(faucetType);
					const timestampLock = Math.floor(Date.now() / 1000) - 90;
					const registrar = 1;
					const signature = await requestFaucetSignature(
						account.wallet,
						account.key.keypair.publicKey,
						account.account,
						chainId,
						registrar,
						timestampLock,
					);

					setStep(Step.LOADING);

					domain.isTxPublishing = true;
					analytics.walletRegistered(
						wallet.factory.wallet,
						account.account.address,
						domain.accounts.accounts.length,
					);
					domain.txChain = faucetType;
					domain.txPlateVisible = true;
					domain.txWithBonus = bonus;

					const promise = publishKeyThroughFaucet(
						faucetType,
						account.key.keypair.publicKey,
						account.account,
						signature,
						registrar,
						timestampLock,
						keyVersion,
					)
						.then(async result => {
							if (result.result) {
								if (doWait) {
									await asyncDelay(20000);
								} else {
									await asyncDelay(7000);
								}
								await account.init();
								domain.publishingTxHash = result.hash;
								domain.isTxPublishing = false;
							} else {
								domain.isTxPublishing = false;
								domain.enforceMainViewOnboarding = true;
								if (result.errorCode === 'ALREADY_EXISTS') {
									console.log(
										`Your address has been already registered or the previous transaction is in progress. Please try connecting another address or wait for transaction to finalize (1-2 minutes).`,
									);
									// document.location.href = generatePath(RoutePath.WALLETS);
								} else {
									console.log(
										'Something went wrong with key publishing :(\n\n' +
											JSON.stringify(result, null, '\t'),
									);
									// document.location.href = generatePath(RoutePath.WALLETS);
								}
							}
						})
						.catch(err => {
							console.log('faucet publication error: ', err);
							domain.isTxPublishing = false;
							domain.txPlateVisible = false;
						});

					if (doWait) {
						await promise;
					}

					onClose?.(account);
				}

				await publishThroughFaucet(
					domainAccount,
					keyVersion,
					// we will publish v3 keys for users having v1 and v2 to polygon
					needToRepublishKey ? 'polygon' : faucetType,
					bonus,
					REACT_APP__APP_MODE === AppMode.OTC,
				);
			} else {
				if (wallet.factory.blockchainGroup === 'evm') {
					setStep(Step.SELECT_NETWORK);
				} else {
					await publishLocalKey();
				}
			}
		} else if (isBytesEqual(freshestKey.key.publicKey.bytes, tempLocalKey.publicKey)) {
			const domainAccount = await createDomainAccount(wallet, account, tempLocalKey, keyVersion);
			analytics.walletConnected(wallet.factory.wallet, account.address, domain.accounts.accounts.length);
			onClose?.(domainAccount);
		} else if (forceNew || withoutPassword) {
			await createDomainAccount(wallet, account, tempLocalKey, keyVersion);
			await publishLocalKey();
		} else {
			toast('Password is wrong. Please try again ❤');
			setStep(Step.ENTER_PASSWORD);
		}
	}

	async function networkSelect(network: EVMNetwork) {
		setNetwork(network);
		setStep(Step.PUBLISH_KEY);
		await publishLocalKey();
	}

	return (
		<>
			{step === Step.LOADING ? (
				<LoadingModal reason="Please wait ..." />
			) : step === Step.ENTER_PASSWORD ? (
				<ActionModal
					title={
						keyParams.isPasswordNeeded
							? keyParams.keyExists
								? 'Enter password'
								: 'Create password'
							: 'Sign authorization message'
					}
					buttons={
						<>
							<ActionButton
								size={ActionButtonSize.XLARGE}
								look={ActionButtonLook.PRIMARY}
								onClick={() => createLocalKey({ password })}
							>
								{keyParams.isPasswordNeeded ? 'Continue' : 'Sign'}
							</ActionButton>
							<ActionButton size={ActionButtonSize.XLARGE} onClick={() => exitUnsuccessfully()}>
								Cancel
							</ActionButton>
						</>
					}
					onClose={() => exitUnsuccessfully()}
				>
					<WalletTag wallet={wallet.factory.wallet} address={account.address} />

					{keyParams.isPasswordNeeded ? (
						keyParams.keyExists ? (
							<div>
								We found your key in <BlockChainLabel blockchain={freshestKey.blockchain} /> blockchain.
								Please, enter your Ylide Password to access it.
							</div>
						) : (
							'This password will be used to encrypt and decrypt your mails.'
						)
					) : (
						keyParams.keyExists && (
							<div>
								We found your key in <BlockChainLabel blockchain={freshestKey.blockchain} /> blockchain.
								Please, sign authroization message to access it.
							</div>
						)
					)}

					{keyParams.isPasswordNeeded ? (
						keyParams.keyExists ? (
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
											showStaticComponent<string>(resolve => (
												<ForgotPasswordModal
													onClose={args => {
														if (args) {
															resolve(args.password);
															if (args.withoutPassword) {
																createLocalKey({
																	password: '',
																	withoutPassword: true,
																});
															} else if (args.password) {
																createLocalKey({
																	password: args.password,
																	forceNew: true,
																});
															}
														}
													}}
												/>
											))
										}
									>
										Forgot Password?
									</button>
								</div>
							</div>
						) : (
							<div>
								<form
									name="sign-up"
									style={{
										display: 'grid',
										gridGap: 12,
										paddingBottom: 20,
									}}
									action="/"
									method="POST"
									noValidate
								>
									<TextField
										look={TextFieldLook.PROMO}
										type="password"
										autoComplete="new-password"
										placeholder="Enter Ylide password"
										value={password}
										onValueChange={setPassword}
									/>
									<TextField
										look={TextFieldLook.PROMO}
										type="password"
										autoComplete="new-password"
										placeholder="Repeat your password"
										value={passwordRepeat}
										onValueChange={setPasswordRepeat}
									/>
								</form>

								<ErrorMessage look={ErrorMessageLook.INFO}>
									<div>
										Ylide <b>doesn't save</b> your password anywhere.
									</div>
									<div>
										Please, save it securely, because if you lose it, you will not be able to access
										your mail.
									</div>
								</ErrorMessage>
							</div>
						)
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
							onClick={() =>
								keyParams.isPasswordNeeded ? setStep(Step.ENTER_PASSWORD) : exitUnsuccessfully()
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

					<div style={{ textAlign: 'center', fontSize: '180%' }}>Confirm the message</div>

					<div>
						{keyParams.isPasswordNeeded
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
										: keyParams.isPasswordNeeded
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
