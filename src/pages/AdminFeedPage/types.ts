export interface IProjectEntity {
	id: string;
	slug: string;
	name: string;
	logo: string | null;
	debank_project_ids: string[] | null;
	meta: any;
	links: { token: string; type: string }[];
}

export const ProjectKeys: (keyof IProjectEntity)[] = [
	'id',
	'slug',
	'name',
	'logo',
	'debank_project_ids',
	'meta',
	'links',
];

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

export interface IDebankProtocol {
	id: string;
	dao_id: string | null;
	project_id: string | null;
	logo_url: string | null;
	name: string | null;
	site_url: string | null;
	platform_token: string | null;
	meta: any;
}

export const DebankKeys: (keyof IDebankProtocol)[] = [
	'id',
	'dao_id',
	'project_id',
	'logo_url',
	'name',
	'site_url',
	'platform_token',
	'meta',
];

export type Paginator<T> = {
	items: T[];
	totalCount: number;
	currentPage: number;
	totalPages: number;
};
