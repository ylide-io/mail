import { EVM_CONTRACTS, EVM_NAMES, EVMNetwork } from '@ylide/ethereum';
import { BlockchainSourceType, IBlockchainSourceSubject, Uint256 } from '@ylide/sdk';

// TODO: move GLOBAL_FEED_ID, EVM_NETWORK, MAILER_ID to env to support staging and prod
export const GLOBAL_FEED_ID = '2f7830e20327e66bf30cf799fe843f309bd2d48755e197945a61e62b58eda151' as Uint256;
const EVM_NETWORK = EVMNetwork.POLYGON;
const MAILER_ID = 80;

const CONTRACTS = EVM_CONTRACTS[EVM_NETWORK];

const BLOCKCHAIN_NAME = EVM_NAMES[EVM_NETWORK];

export const getGlobalFeedSubject = (sender: string | null = null): IBlockchainSourceSubject => ({
	feedId: GLOBAL_FEED_ID,
	type: BlockchainSourceType.BROADCAST,
	sender,
	blockchain: BLOCKCHAIN_NAME,
	id: `evm-${BLOCKCHAIN_NAME}-mailer-${MAILER_ID}`,
});

export const getMailerContractsLink = () => CONTRACTS.mailerContracts.find(l => l.id === MAILER_ID);
