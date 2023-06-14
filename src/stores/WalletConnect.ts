import { computed, observable } from 'mobx';

export interface WalletInterface {
	id: string;
	name: string;
	description: string;
	homepage: string;
	chains: string[];
	versions: string[];
	sdks: 'sign_v1'[];
	app_type: 'wallet';
	image_id: string;
	image_url: {
		sm: string;
		md: string;
		lg: string;
	};
	app: {
		browser: string | null;
		ios: string | null;
		android: string | null;
		mac: string | null;
		windows: string | null;
		linux: string | null;
	};
	mobile: {
		native: string | null;
		universal: string | null;
	};
	desktop: {
		native: string | null;
		universal: string | null;
	};
	metadata: {
		shortName: string;
		colors: {
			primary: string | null;
			secondary: string | null;
		};
	};
}

class WalletConnectStore {
	registry: any = {};

	@observable wallets: WalletInterface[] = [];
	@observable loaded = false;
	@observable loading = false;

	@computed get desktopWallets(): WalletInterface[] {
		return this.wallets.filter(w => w.desktop.universal || w.desktop.native);
	}

	@computed get mobileWallets(): WalletInterface[] {
		return this.wallets.filter(w => w.desktop.universal || w.desktop.native);
	}

	async load() {
		if (this.loaded || this.loading) {
			return;
		}
		this.loading = true;
		try {
			const url = `https://registry.walletconnect.com/api/v2/wallets`;
			const response = await fetch(url);
			const data = await response.json();

			this.registry = data.listings;
			this.wallets = Object.keys(data.listings).map(id => data.listings[id]);

			this.loaded = true;
		} finally {
			this.loading = false;
		}
	}
}

const walletConnect = new WalletConnectStore();
export default walletConnect;
