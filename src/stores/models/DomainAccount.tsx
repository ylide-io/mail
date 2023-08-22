import { EVMNetwork } from '@ylide/ethereum';
import { RemotePublicKey, ServiceCode, WalletAccount, YlideCore, YlideKeysRegistry, YlidePrivateKey } from '@ylide/sdk';
import { computed, makeAutoObservable, observable } from 'mobx';

import { AdaptiveAddress } from '../../components/adaptiveAddress/adaptiveAddress';
import { toast } from '../../components/toast/toast';
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
		console.log('background read keys history');
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

	async getBalances(): Promise<Record<string, { original: string; numeric: number; e18: string }>> {
		return await this.wallet.getBalancesOf(this.account.address);
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

	async makeMainViewKey(invite = '') {
		return await this.wallet.constructMainViewKey(this.account, invite);
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
}
