import { EVM_NAMES, EVMNetwork } from '@ylide/ethereum';
import { ExternalYlidePublicKey, IGenericAccount, ServiceCode, YlideCore, YlideKey } from '@ylide/sdk';
import { makeAutoObservable } from 'mobx';

import { blockchainMeta } from '../../utils/blockchain';
import { isBytesEqual } from '../../utils/isBytesEqual';
import { browserStorage } from '../browserStorage';
import { Wallet } from './Wallet';

export class DomainAccount {
	readonly wallet: Wallet;
	readonly account: IGenericAccount;
	readonly key: YlideKey;
	readonly keyVersion: number;
	private _name: string;

	remoteKey: ExternalYlidePublicKey | null = null;
	remoteKeys: Record<string, ExternalYlidePublicKey | null> = {};

	constructor(wallet: Wallet, account: IGenericAccount, key: YlideKey, keyVersion: number, name: string) {
		makeAutoObservable(this);

		this.wallet = wallet;
		this.account = account;
		this.key = key;
		this.keyVersion = keyVersion;
		this._name = name;
	}

	get name() {
		return this._name;
	}

	async rename(newName: string) {
		newName = newName.trim();
		if (newName.length > 255) {
			throw new Error('Max account length is 255');
		}
		this._name = newName;
		await this.wallet.domain.storage.storeString('yld1_accName_' + this.key.address, this._name);
	}

	appropriateBlockchains() {
		return this.wallet.domain.registeredBlockchains
			.filter(bc => bc.blockchainGroup === this.wallet.factory.blockchainGroup)
			.map(factory => ({
				factory,
				reader: this.wallet.domain.blockchains[factory.blockchain],
			}));
	}

	getBlockchainNativeCurrency(network?: EVMNetwork) {
		const name = this.getBlockchainName(network);
		return blockchainMeta[name].symbol || blockchainMeta[name].ethNetwork?.nativeCurrency.symbol || '';
	}

	getBlockchainName(network?: EVMNetwork) {
		const blockchains = this.appropriateBlockchains();
		if (blockchains.length === 0) {
			throw new Error('No appropriate blockchains');
		} else if (blockchains.length === 1) {
			return blockchains[0].factory.blockchain;
		} else {
			if (network == null) {
				throw new Error('Cant find appropriate blockchain without network');
			}
			const blockchain = blockchains.find(bc => bc.factory.blockchain === EVM_NAMES[network]);
			if (!blockchain) {
				throw new Error('Cant find appropriate blockchain for this network');
			}
			return blockchain.factory.blockchain;
		}
	}

	async getBalances(): Promise<Record<string, { original: string; numeric: number; e18: string }>> {
		return await this.wallet.getBalancesOf(this.account.address);
	}

	async init() {
		await this.readRemoteKeys();
	}

	private async readRemoteKeys() {
		const { remoteKeys, remoteKey } = await this.wallet.readRemoteKeys(this.account);
		this.remoteKeys = remoteKeys;
		this.remoteKey = remoteKey;
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

	get isAnyKeyRegistered() {
		return !!this.remoteKey;
	}

	get isLocalKeyRegistered() {
		return !!this.remoteKey && isBytesEqual(this.key.keypair.publicKey, this.remoteKey.publicKey.bytes);
	}

	async attachRemoteKey(preferredNetwork?: EVMNetwork) {
		await this.wallet.controller.attachPublicKey(
			this.account,
			this.key.keypair.publicKey,
			this.keyVersion,
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
}
