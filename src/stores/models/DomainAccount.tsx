import { EVMNetwork } from '@ylide/ethereum';
import { RemotePublicKey, ServiceCode, WalletAccount, YlideCore, YlideKeysRegistry, YlidePrivateKey } from '@ylide/sdk';
import { SmartBuffer } from '@ylide/smart-buffer';
import { computed, makeAutoObservable, observable } from 'mobx';

import { BlockchainFeedApi } from '../../api/blockchainFeedApi';
import { AdaptiveAddress } from '../../components/adaptiveAddress/adaptiveAddress';
import { toast } from '../../components/toast/toast';
import { REACT_APP__FEED_PUBLIC_KEY } from '../../env';
import { invariant } from '../../utils/assert';
import { browserStorage } from '../browserStorage';
import { Wallet } from './Wallet';

export class DomainAccount {
	@observable private _localPrivateKeys: YlidePrivateKey[] = [];
	@observable private _remotePublicKeys: RemotePublicKey[] = [];
	@observable private _freshestRemotePublicKey: RemotePublicKey | undefined;

	private _name: string;

	constructor(
		public readonly keysRegistry: YlideKeysRegistry,
		public readonly wallet: Wallet,
		public readonly account: WalletAccount,
		name: string,
	) {
		makeAutoObservable(this);

		this._name = name;

		this.reloadKeys();

		this.reloadAuthKey();
	}

	public async reloadAuthKey() {
		if (!this.authKey) {
			try {
				const key = await this.createAuthKey();
				invariant(key, 'Auth key not created');

				const { token } = await BlockchainFeedApi.auth(key);
				this.authKey = token;
			} catch (e) {
				console.error(e);
			}
		}
	}

	public reloadKeys() {
		this._localPrivateKeys = this.keysRegistry.getLocalPrivateKeys(this.account.address);
		this._remotePublicKeys = this.keysRegistry.getRemotePublicKeys(this.account.address);
		this._freshestRemotePublicKey = this.keysRegistry.getFreshestRemotePublicKey(this.account.address) || undefined;
	}

	@computed get localPrivateKeys() {
		return this._localPrivateKeys;
	}

	@computed get isAnyLocalPrivateKeyRegistered() {
		return this.localPrivateKeys.some(it => this._remotePublicKeys.some(rpk => rpk.publicKey.equals(it.publicKey)));
	}

	@computed get freshestRemotePublicKey() {
		return this._freshestRemotePublicKey;
	}

	async firstTimeReadRemoteKeys() {
		const { remoteKeys } = await this.wallet.domain.ylide.core.getAddressKeys(this.account.address);
		for (const blockchain of Object.keys(remoteKeys)) {
			const remoteKey = remoteKeys[blockchain];
			if (remoteKey) {
				await this.keysRegistry.addRemotePublicKey(remoteKey);
			}
		}

		this.reloadKeys();
	}

	async backgroundReadKeysHistory() {
		const remoteKeys = await this.wallet.domain.ylide.core.getAddressesKeysHistory([this.account.address]);
		for (const remoteKey of remoteKeys[this.account.address]) {
			await this.keysRegistry.addRemotePublicKey(remoteKey);
		}

		this.reloadKeys();
	}

	async backgroundCheckForNewRemoteKeys(displayToast: boolean = true) {
		const { freshestKey, remoteKeys } = await this.wallet.domain.ylide.core.getAddressKeys(this.account.address);

		const cachedFK = this._freshestRemotePublicKey;
		const actualFK = freshestKey;

		if (cachedFK?.publicKey.toHex() !== actualFK?.publicKey.toHex()) {
			for (const blockchain of Object.keys(remoteKeys)) {
				const remoteKey = remoteKeys[blockchain];
				if (remoteKey) {
					await this.keysRegistry.addRemotePublicKey(remoteKey);
				}
			}

			if (displayToast) {
				// TODO: remove from here
				toast(
					<>
						<b>
							<AdaptiveAddress maxLength={12} address={this.account.address} />
						</b>
						<div>Your Ylide public keys for this account have been updated. Please re-connect it 🙏</div>
					</>,
				);
			}
		}

		this.reloadKeys();
	}

	get name() {
		return this._name;
	}

	rename(newName: string) {
		newName = newName.trim();
		if (newName.length > 255) {
			throw new Error('Max account length is 255');
		}
		this._name = newName;
		this.wallet.domain.accounts.save();
	}

	get uint256Address() {
		return this.wallet.controller.addressToUint256(this.account.address);
	}

	get sentAddress() {
		return YlideCore.getSentAddress(this.wallet.controller.addressToUint256(this.account.address));
	}

	get isCurrentlySelected() {
		return this.wallet.isItCurrentAccount(this);
	}

	async addNewLocalPrivateKey(key: YlidePrivateKey) {
		await this.keysRegistry.addLocalPrivateKey(key);
		this.reloadKeys();
	}

	async publishPublicKey(key: YlidePrivateKey, preferredNetwork?: EVMNetwork) {
		await this.wallet.controller.attachPublicKey(
			this.account,
			key.publicKey.keyBytes,
			key.publicKey.keyVersion,
			ServiceCode.MAIL,
			{
				network: preferredNetwork,
			},
		);
	}

	async makeMainViewKey() {
		return await this.wallet.constructMainViewKey(this.account);
	}

	get mainViewKey() {
		return browserStorage.mainViewKeys[this.account.address] || '';
	}

	set mainViewKey(key: string) {
		browserStorage.mainViewKeys = {
			...browserStorage.mainViewKeys,
			[this.account.address]: key || undefined,
		};
	}

	async createAuthKey() {
		if (this._localPrivateKeys[0]) {
			const mvPublicKey = SmartBuffer.ofHexString(REACT_APP__FEED_PUBLIC_KEY!).bytes;

			const messageBytes = SmartBuffer.ofUTF8String(
				JSON.stringify({ address: this.account.address, timestamp: Date.now() }),
			).bytes;

			return this._localPrivateKeys[0].execute(
				async privateKey => ({
					messageEncrypted: new SmartBuffer(privateKey.encrypt(messageBytes, mvPublicKey)).toHexString(),
					publicKey: new SmartBuffer(privateKey.publicKey).toHexString(),
					address: this.account.address,
				}),
				// TODO: handle users with password
				// {
				// 	onPrivateKeyRequest: async (address: string, magicString: string) =>
				// 		await this.wallet.controller.signMagicString(this.account, magicString),
				// 	onYlidePasswordRequest: async _ => password,
				// },
			);
		}
		return null;
	}

	get authKey() {
		return browserStorage.authKeys[this.account.address] || '';
	}

	set authKey(key: string) {
		browserStorage.authKeys = {
			...browserStorage.authKeys,
			[this.account.address]: key || undefined,
		};
	}
}
