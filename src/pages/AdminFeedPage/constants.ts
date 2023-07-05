export const SCANNERS: Record<string, string> = {
	cro: 'https://cronoscan.com',
	eth: 'https://etherscan.io',
	bsc: 'https://bscscan.com',
	arb: 'https://arbiscan.io',
	avax: 'https://snowtrace.io',
	op: 'https://optimistic.etherscan.io',
	matic: 'https://polygonscan.com',
	ftm: 'https://ftmscan.com',
	klay: 'https://scope.klaytn.com',
	xdai: 'https://gnosisscan.io',
	aurora: 'https://aurorascan.dev',
	celo: 'https://celoscan.io',
	mobm: 'https://moonbeam.moonscan.io',
	movr: 'https://moonriver.moonscan.io',
	metis: 'https://andromeda-explorer.metis.io',
	astar: 'https://astar.subscan.io',
};

export const BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:8271' : 'https://fm-api.ylide.io';

export const DEFAULT_PAGINATOR = {
	items: [],
	currentPage: 0,
	totalCount: 0,
	totalPages: 0,
};
