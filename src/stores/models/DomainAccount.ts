import { EVM_NAMES, EVMNetwork } from '@ylide/ethereum';
import { Ylide, YlideKey } from '@ylide/sdk';
import { IGenericAccount } from '@ylide/sdk';
import { observable, computed, makeAutoObservable } from 'mobx';
import { isBytesEqual } from '../../utils/isBytesEqual';
import { Wallet } from './Wallet';

export class DomainAccount {
	readonly wallet: Wallet;
	readonly account: IGenericAccount;
	readonly key: YlideKey;

	@observable remoteKey: Uint8Array | null = null;

	@observable remoteKeys: Record<string, Uint8Array | null> = {};

	constructor(wallet: Wallet, account: IGenericAccount, key: YlideKey) {
		makeAutoObservable(this);

		this.wallet = wallet;
		this.account = account;
		this.key = key;
	}

	appropriateBlockchains() {
		return this.wallet.domain.registeredBlockchains
			.filter(bc => bc.blockchainGroup === this.wallet.factory.blockchainGroup)
			.map(factory => ({
				factory,
				reader: this.wallet.domain.blockchains[factory.blockchain],
			}));
	}

	async getBalances(): Promise<Record<string, { original: string; number: number; e18: string }>> {
		const chains = this.wallet.domain.registeredBlockchains.filter(
			bc => bc.blockchainGroup === this.wallet.factory.blockchainGroup,
		);
		const balances = await Promise.all(
			chains.map(async chain => {
				return this.wallet.domain.blockchains[chain.blockchain].getBalance(this.account.address);
			}),
		);
		return chains.reduce(
			(p, c, i) => ({
				...p,
				[c.blockchain]: balances[i],
			}),
			{} as Record<string, { original: string; number: number; e18: string }>,
		);
	}

	async init() {
		// this.readLocalKey();
		await this.readRemoteKeys();
	}

	// private readLocalKey() {
	// 	const keystoreAccount = this.wallet.domain.keystore.get(this.account.address);
	// 	this.localKey = keystoreAccount?.publicKey || null;
	// }

	// async destroyLocalKey() {
	// 	const key = this.wallet.domain.keystore.keys.find(k => k.address === this.account.address);
	// 	if (key) {
	// 		await this.wallet.domain.keystore.delete(key);
	// 	}
	// 	this.localKey = null;
	// }

	// private async readRemoteKey() {
	// 	const blockchainName = await this.wallet.controller.getCurrentBlockchain();
	// 	const blockchain = this.wallet.domain.blockchains[blockchainName];
	// 	const pk = await blockchain.extractPublicKeyFromAddress(this.account.address);
	// 	if (pk) {
	// 		this.remoteKey = pk.bytes;
	// 	}
	// }

	private async readRemoteKeys() {
		const { remoteKeys, remoteKey } = await this.wallet.readRemoteKeys(this.account);
		this.remoteKeys = remoteKeys;
		this.remoteKey = remoteKey;
	}

	get uint256Address() {
		return this.wallet.controller.addressToUint256(this.account.address);
	}

	get sentAddress() {
		return Ylide.getSentAddress(this.wallet.controller.addressToUint256(this.account.address));
	}

	@computed get isCurrentlySelected() {
		return this.wallet.isItCurrentAccount(this);
	}

	@computed get isAnyKeyRegistered() {
		return !!this.remoteKey;
	}

	@computed get isLocalKeyRegistered() {
		return this.remoteKey && isBytesEqual(this.key.keypair.publicKey, this.remoteKey);
	}

	async attachRemoteKey() {
		const evmNetworks = (Object.keys(EVM_NAMES) as unknown as EVMNetwork[]).map((network: EVMNetwork) => ({
			name: EVM_NAMES[network],
			network: Number(network) as EVMNetwork,
		}));
		const blockchainName = await this.wallet.controller.getCurrentBlockchain();
		const network = evmNetworks.find(n => n.name === blockchainName)?.network;
		await this.wallet.controller.attachPublicKey(this.account, this.key.keypair.publicKey, {
			network,
		});
	}
}
