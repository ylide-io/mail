import { makeObservable, observable } from 'mobx';

export interface IAppEntry {
	id: string;
	name: string;
	homepage: string;
	chains: string[];
	image_id: string;
	image_url: {
		sm: string;
		md: string;
		lg: string;
	};
	app: {
		browser: string;
		ios: string;
		android: string;
		mac: string;
		windows: string;
		linux: string;
	};
	mobile: {
		native: string;
		universal: string;
	};
	desktop: {
		native: string;
		universal: string;
	};
	metadata: {
		shortName: string;
		colors: {
			primary: string;
			secondary: string;
		};
	};
}

export interface IAppRegistry {
	[id: string]: IAppEntry;
}

class WalletConnectRegistry {
	@observable.ref registry: IAppRegistry = {};

	@observable loading = true;

	constructor() {
		makeObservable(this);

		this.refetch();
	}

	async refetch() {
		try {
			this.loading = true;

			const response = await fetch('https://registry.walletconnect.com/api/v2/wallets');
			const data = await response.json();

			this.registry = data.listings;
		} finally {
			this.loading = false;
		}
	}
}

export const walletConnectRegistry = new WalletConnectRegistry();
