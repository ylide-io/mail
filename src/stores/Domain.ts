import { useWeb3Modal } from '@web3modal/wagmi/react';
import { action, autorun, makeObservable, observable } from 'mobx';
import { useSignMessage } from 'wagmi';

import { MainviewApi } from '../api/mainviewApi';
import asyncTimer from '../utils/asyncTimer';
import { isPaid, isTrialActive } from '../utils/payments';
import { browserStorage } from './browserStorage';
import { FeedSourcesStore } from './FeedSources';
import { FeedsRepository } from './FeedsRepository';
import { DomainAccount } from './models/DomainAccount';

type OpenOptions = Parameters<ReturnType<typeof useWeb3Modal>['open']>[0];
type SignMessageArgs = Parameters<ReturnType<typeof useSignMessage>['signMessageAsync']>[0];

export class Domain {
	@observable initialized = false;

	address: string | undefined = undefined;

	@observable session!: string;
	@observable account: DomainAccount | null = null;
	@observable accountPlan: MainviewApi.AccountPlan | null = null;

	@observable tooMuch: boolean = false;

	feedsRepository: FeedsRepository;
	feedSources: FeedSourcesStore;

	_open: (opts?: OpenOptions) => void = () => {};
	_disconnect: () => void = () => {};
	_signMessageAsync: (opts?: SignMessageArgs) => Promise<string> = () => Promise.resolve('');

	constructor() {
		makeObservable(this);

		this.feedsRepository = new FeedsRepository(this);
		this.feedSources = new FeedSourcesStore(this);
	}

	async reloadAccountPlan() {
		if (this.account) {
			this.accountPlan = await MainviewApi.payments.getAccountPlan({ token: this.session });
		} else {
			this.accountPlan = null;
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

	// showAccountModal() {
	// 	this._open({
	// 		view: 'Account',
	// 	});
	// }

	async requestWalletAccount(): Promise<string | undefined> {
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

	disconnectWalletAccount() {
		this._disconnect();
	}

	_gotAddress(addr: string | undefined) {
		if (addr === this.address) {
			return;
		}
		this.address = addr;
		console.log('addr: ', addr);
		if (this.onGetAccount) {
			this.onGetAccount(addr);
		} else {
			//
		}
	}

	@action
	async logout() {
		await MainviewApi.auth.logout(this.session);

		this.account = null;
		this.accountPlan = null;
		this.feedsRepository.feedAccesses = [];
		this.feedsRepository.feedDataById.clear();
		this.feedsRepository.feedSettingsById.clear();
	}

	// analytics.mainviewOnboardingEvent('feed-initialized');
	// analytics.mainviewOnboardingEvent('feed-initialization-error');

	initingTimer: null | (() => void) = null;

	async init() {
		if (this.initialized) {
			return;
		}
		await Promise.all([
			MainviewApi.auth.session(browserStorage.session).then(session => {
				if (session.type === 'new') {
					browserStorage.session = session.token;
					this.session = session.token;
					this.account = null;
					this.accountPlan = null;
				} else {
					this.session = browserStorage.session!;
					this.account = session.account
						? new DomainAccount(
								session.account.id,
								session.account.address,
								session.account.email,
								session.account.defaultFeedId,
								session.account.plan,
								session.account.planEndsAt,
								session.account.inited,
						  )
						: null;
				}
			}),
		]);

		this.initialized = true;

		autorun(() => {
			if (this.account && !this.account.inited) {
				if (this.initingTimer) {
					this.initingTimer();
					this.initingTimer = null;
				}
				this.initingTimer = asyncTimer(async () => {
					if (!this.account) {
						return;
					}
					const { inited, initing } = await MainviewApi.general.checkInited(this.session);
					if (inited) {
						this.account.inited = true;
					} else {
						if (initing) {
							console.log('just waiting');
						} else {
							console.log('requesting reinit');
							await MainviewApi.general.reinit(this.session);
						}
					}
				}, 2000);
			} else {
				if (this.initingTimer) {
					this.initingTimer();
					this.initingTimer = null;
				}
			}
		});
	}
}

//@ts-ignore
const domain = (window.domain = new Domain());
export default domain;
