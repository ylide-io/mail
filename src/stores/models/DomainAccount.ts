import { EVM_NAMES, EVMNetwork } from '@ylide/ethereum';
import {
	ExternalYlidePublicKey,
	IGenericAccount,
	ServiceCode,
	YlideCore,
	YlideKey,
	YlidePublicKeyVersion,
} from '@ylide/sdk';
import { computed, makeAutoObservable, observable } from 'mobx';

import { isBytesEqual } from '../../utils/isBytesEqual';
import { Wallet } from './Wallet';

export class DomainAccount {
	readonly wallet: Wallet;
	readonly account: IGenericAccount;
	readonly key: YlideKey;
	private _name: string;

	@observable remoteKey: ExternalYlidePublicKey | null = null;

	@observable remoteKeys: Record<string, ExternalYlidePublicKey | null> = {};

	constructor(wallet: Wallet, account: IGenericAccount, key: YlideKey, name: string) {
		makeAutoObservable(this);

		this.wallet = wallet;
		this.account = account;
		this.key = key;
		this._name = name;
	}

	get name() {
		return this._name;
	}

	async rename(newName: string) {
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

	@computed get isCurrentlySelected() {
		return this.wallet.isItCurrentAccount(this);
	}

	@computed get isAnyKeyRegistered() {
		return !!this.remoteKey;
	}

	@computed get isLocalKeyRegistered() {
		return this.remoteKey && isBytesEqual(this.key.keypair.publicKey, this.remoteKey.publicKey.bytes);
	}

	async attachRemoteKey(preferredNetwork?: EVMNetwork) {
		const evmNetworks = (Object.keys(EVM_NAMES) as unknown as EVMNetwork[]).map((network: EVMNetwork) => ({
			name: EVM_NAMES[network],
			network: Number(network) as EVMNetwork,
		}));
		const blockchainName = await this.wallet.controller.getCurrentBlockchain();
		const network =
			preferredNetwork === undefined
				? evmNetworks.find(n => n.name === blockchainName)?.network
				: preferredNetwork;
		await this.wallet.controller.attachPublicKey(
			this.account,
			this.key.keypair.publicKey,
			YlidePublicKeyVersion.KEY_V2,
			ServiceCode.MAIL,
			{
				network,
			},
		);
	}
}
