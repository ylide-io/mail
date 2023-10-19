import { EVM_CONTRACTS } from '@ylide/ethereum';
import { BlockchainSourceType, IBlockchainSourceSubject, IMessage } from '@ylide/sdk';

import { REACT_APP__GLOBAL_FEED_ID, REACT_APP__GLOBAL_FEED_MAILER_ID, REACT_APP__GLOBAL_FEED_NETWORK } from '../env';
import { evmNameToNetwork } from './blockchain';

const evmNetwork = evmNameToNetwork(REACT_APP__GLOBAL_FEED_NETWORK)!;
const contracts = EVM_CONTRACTS[evmNetwork];

export const SEND_TO_ALL_ADDRESS = '0x0000000000000000000000000000000000000000';

export function getGlobalFeedSubject(sender: string | null = null): IBlockchainSourceSubject {
	return {
		feedId: REACT_APP__GLOBAL_FEED_ID,
		type: BlockchainSourceType.BROADCAST,
		sender,
		blockchain: REACT_APP__GLOBAL_FEED_NETWORK,
		id: `evm-${REACT_APP__GLOBAL_FEED_NETWORK}-mailer-${REACT_APP__GLOBAL_FEED_MAILER_ID}`,
	};
}

export function getMailerContractsLink() {
	return contracts.mailerContracts.find(l => l.id === REACT_APP__GLOBAL_FEED_MAILER_ID);
}

export function isGlobalMessage(msg: IMessage) {
	return msg.feedId === REACT_APP__GLOBAL_FEED_ID;
}
