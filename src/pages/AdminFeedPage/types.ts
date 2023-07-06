export interface IProjectEntity {
	id: string;
	slug: string;
	name: string;
	logo: string | null;
	meta: any;
	links: { token: string; type: string }[];
}

export interface ITokenEntity {
	token: string;
	decimals: number | null;
	symbol: string | null;
	display_symbol: string | null;
	optimized_symbol: string | null;
	is_core: boolean | null;
	is_scam: boolean | null;
	is_wallet: boolean | null;
	is_verified: boolean | null;
	logo_url: string | null;
	name: string | null;
	price: number | null;
	protocol_id: string | null;
	time_at: number | null;
}

export type Paginator<T> = {
	items: T[];
	totalCount: number;
	currentPage: number;
	totalPages: number;
};
