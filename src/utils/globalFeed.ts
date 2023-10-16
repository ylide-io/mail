import { EVM_CONTRACTS } from '@ylide/ethereum';
import { BlockchainSourceType, IBlockchainSourceSubject } from '@ylide/sdk';

import { REACT_APP__GLOBAL_FEED_ID, REACT_APP__GLOBAL_FEED_MAILER_ID, REACT_APP__GLOBAL_FEED_NETWORK } from '../env';
import { evmNameToNetwork } from './blockchain';

const evmNetwork = evmNameToNetwork(REACT_APP__GLOBAL_FEED_NETWORK)!;
const contracts = EVM_CONTRACTS[evmNetwork];

export const getGlobalFeedSubject = (sender: string | null = null): IBlockchainSourceSubject => ({
	feedId: REACT_APP__GLOBAL_FEED_ID,
	type: BlockchainSourceType.BROADCAST,
	sender,
	blockchain: REACT_APP__GLOBAL_FEED_NETWORK,
	id: `evm-${REACT_APP__GLOBAL_FEED_NETWORK}-mailer-${REACT_APP__GLOBAL_FEED_MAILER_ID}`,
});

export const getMailerContractsLink = () =>
	contracts.mailerContracts.find(l => l.id === REACT_APP__GLOBAL_FEED_MAILER_ID);
