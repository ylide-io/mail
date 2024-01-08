import { useWeb3Modal } from '@web3modal/wagmi/react';
import { autorun, makeObservable, observable } from 'mobx';
import { useSignMessage } from 'wagmi';

import { FeedManagerApi } from '../api/feedManagerApi';
import { ensurePageLoaded } from '../utils/ensurePageLoaded';
import { isPaid, isTrialActive } from '../utils/payments';
import { browserStorage } from './browserStorage';
import { FeedSettings } from './FeedSettings';
import { DomainAccount } from './models/DomainAccount';

// Ylide.verbose();

type OpenOptions = Parameters<ReturnType<typeof useWeb3Modal>['open']>[0];
type SignMessageArgs = Parameters<ReturnType<typeof useSignMessage>['signMessageAsync']>[0];

export class Domain {
	savedPassword: string | null = null;

	@observable initialized = false;

	@observable devMode = false; //document.location.href.includes('localhost');
	@observable address: string | null = null;
	@observable account: DomainAccount | null = null;
	@observable paymentInfo: FeedManagerApi.PaymentInfo | undefined = undefined;
	@observable tooMuch: boolean = false;

	feedSettings: FeedSettings;

	_open: (opts?: OpenOptions) => void = () => {};
	_disconnect: () => void = () => {};
	_signMessageAsync: (opts?: SignMessageArgs) => Promise<string> = () => Promise.resolve('');

	constructor() {
		makeObservable(this);

		this.feedSettings = new FeedSettings(this);

		window.addEventListener('keydown', e => {
			if (e.ctrlKey && e.key === 'KeyD') {
				this.devMode = !this.devMode;
			}
		});

		autorun(() => {
			if (this.account) {
				this.paymentInfo = undefined;
				FeedManagerApi.getPaymentInfo({ token: this.account.mainviewKey })
					.then(info => {
						this.paymentInfo = info;
					})
					.catch(err => {
						console.error(err);
					});
			} else {
				this.paymentInfo = undefined;
			}
		});
	}

	get isTooMuch() {
		return this.tooMuch && (!domain.account || domain.isAccountMustPay);
	}

	get isAccountActive() {
		return this.account && this.paymentInfo && (isTrialActive(this.paymentInfo) || isPaid(this.paymentInfo));
	}

	get isAccountMustPay() {
		return this.account && this.paymentInfo && !isTrialActive(this.paymentInfo) && !isPaid(this.paymentInfo);
	}

	onGetAccount: null | ((addr: string | undefined) => void) = null;

	showAccountModal() {
		this._open({
			view: 'Account',
		});
	}

	async connectAccount(): Promise<string | undefined> {
		return new Promise(async (resolve, reject) => {
			if (this.address) {
				resolve(this.address);
				return;
			}
			this.onGetAccount = addr => {
				this.onGetAccount = null;
				if (addr) {
					resolve(addr);
				} else {
					resolve(undefined);
				}
			};
			this._open({
				view: 'Connect',
			});
		});
	}

	disconnectAccount() {
		this._disconnect();
	}

	_gotAddress(addr: string | undefined) {
		this.address = addr || null;
		if (this.onGetAccount) {
			this.onGetAccount(addr);
		} else {
			if (!addr) {
				browserStorage.mainViewKeys = {};
			}
			const address = (addr || '').toLowerCase();
			if (addr && browserStorage.mainViewKeys[address]) {
				browserStorage.isAuthorized = true;
				this.account = new DomainAccount(address, browserStorage.mainViewKeys[address]!);
			} else {
				browserStorage.isAuthorized = false;
				this.account = null;
			}
		}
	}

	async init() {
		if (this.initialized) {
			return;
		}
		await ensurePageLoaded;
		this.initialized = true;
	}
}

//@ts-ignore
const domain = (window.domain = new Domain());
export default domain;
