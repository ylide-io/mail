import { useWeb3Modal } from '@web3modal/wagmi/react';
import { autorun, makeObservable, observable } from 'mobx';
import { useSignMessage } from 'wagmi';

import { MainviewApi } from '../api/mainviewApi';
import { ensurePageLoaded } from '../utils/ensurePageLoaded';
import { isPaid, isTrialActive } from '../utils/payments';
import { browserStorage } from './browserStorage';
import { FeedsRepository } from './FeedsRepository';
import { FeedSourcesStore } from './FeedSources';
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
	@observable accountPlan: MainviewApi.AccountPlan | undefined = undefined;
	@observable tooMuch: boolean = false;

	feedsRepository: FeedsRepository;
	feedSources: FeedSourcesStore = new FeedSourcesStore();

	_open: (opts?: OpenOptions) => void = () => {};
	_disconnect: () => void = () => {};
	_signMessageAsync: (opts?: SignMessageArgs) => Promise<string> = () => Promise.resolve('');

	constructor() {
		makeObservable(this);

		autorun(() => {
			if (this.account) {
				this.accountPlan = undefined;
				MainviewApi.getAccountPlan(this.account)
					.then(plan => {
						this.accountPlan = plan;
					})
					.catch(err => {
						console.error(err);
					});
			} else {
				this.accountPlan = undefined;
			}
		});

		this.feedsRepository = new FeedsRepository(this);

		window.addEventListener('keydown', e => {
			if (e.ctrlKey && e.key === 'KeyD') {
				this.devMode = !this.devMode;
			}
		});
	}

	async reloadAccountPlan() {
		if (this.account) {
			this.accountPlan = undefined;
			this.accountPlan = await MainviewApi.getAccountPlan(this.account);
		} else {
			this.accountPlan = undefined;
		}
	}

	get isTooMuch() {
		return this.tooMuch && (!domain.account || domain.isAccountMustPay);
	}

	get isAccountActive() {
		return this.account && this.accountPlan && (isTrialActive(this.accountPlan) || isPaid(this.accountPlan));
	}

	get isAccountMustPay() {
		return this.account && this.accountPlan && !isTrialActive(this.accountPlan) && !isPaid(this.accountPlan);
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
				browserStorage.mainviewAccounts = {};
			}
			const address = (addr || '').toLowerCase();
			if (addr && browserStorage.mainviewAccounts[address]) {
				browserStorage.isAuthorized = true;
				const d = browserStorage.mainviewAccounts[address]!;
				this.account = new DomainAccount(
					d.id,
					d.address,
					d.email,
					d.defaultFeedId,
					d.plan,
					d.planEndsAt,
					d.token,
				);
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
