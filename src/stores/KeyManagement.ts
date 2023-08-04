import { constructFaucetMsg, EthereumWalletController, EVM_CHAINS, EVM_NAMES, EVMNetwork } from '@ylide/ethereum';
import { PublicKey, WalletAccount } from '@ylide/sdk';
import { SmartBuffer } from '@ylide/smart-buffer';

import { Wallet } from './models/Wallet';

export const requestFaucetSignature = async (
	wallet: Wallet,
	publicKey: Uint8Array,
	account: WalletAccount,
	chainId: number,
	registrar: number,
	timestampLock: number,
) => {
	const msg = constructFaucetMsg(publicKey, registrar, chainId, timestampLock);

	try {
		return await (wallet.controller as EthereumWalletController).signString(account, msg);
	} catch (err) {
		console.error('requestFaucetSignature error: ', err);
		throw err;
	}
};

export const evmNetworkByFaucetType = (faucetType: 'polygon' | 'gnosis' | 'fantom') => {
	if (faucetType === 'polygon') {
		return EVMNetwork.POLYGON;
	} else if (faucetType === 'gnosis') {
		return EVMNetwork.GNOSIS;
	} else if (faucetType === 'fantom') {
		return EVMNetwork.FANTOM;
	} else {
		throw new Error('Invalid faucet type');
	}
};

export const chainIdByFaucetType = (faucetType: 'polygon' | 'gnosis' | 'fantom') => {
	return EVM_CHAINS[evmNetworkByFaucetType(faucetType)];
};

export const blockchainByFaucetType = (faucetType: 'polygon' | 'gnosis' | 'fantom') => {
	return EVM_NAMES[evmNetworkByFaucetType(faucetType)];
};

export const publishKeyThroughFaucet = async (
	faucetType: 'polygon' | 'gnosis' | 'fantom',
	publicKey: PublicKey,
	account: WalletAccount,
	signature: Awaited<ReturnType<typeof requestFaucetSignature>>,
	registrar: number,
	timestampLock: number,
): Promise<
	| { result: true; hash: string }
	| { result: false; errorCode: 'ALREADY_EXISTS' }
	| { result: false; errorCode: 'GENERIC_ERROR'; rawError: any }
> => {
	const faucetUrl = `https://faucet.ylide.io/${faucetType}`;
	const response = await fetch(faucetUrl, {
		method: 'POST',
		body: JSON.stringify({
			address: account.address.toLowerCase(),
			referrer: '0x0000000000000000000000000000000000000000',
			payBonus: '0',
			registrar,
			timestampLock,
			publicKey: '0x' + new SmartBuffer(publicKey.keyBytes).toHexString(),
			keyVersion: publicKey.keyVersion,
			_r: signature.r,
			_s: signature.s,
			_v: signature.v,
		}),
	});
	const result = await response.json();
	if (result && result.data && result.data.txHash) {
		return { result: true, hash: result.data.txHash };
	} else {
		if (result.error === 'Already exists') {
			return { result: false, errorCode: 'ALREADY_EXISTS' };
		} else {
			return { result: false, errorCode: 'GENERIC_ERROR', rawError: result };
		}
	}
};
