import { computed, makeObservable, observable } from 'mobx';

export interface IDomainAccount {
	id: string;
	address: string;
	email: string | null;
	defaultFeedId: string;
	plan: 'none' | 'trial' | 'basic' | 'pro';
	planEndsAt: number;

	inited: boolean;
}

export class DomainAccount implements IDomainAccount {
	id: string;
	@observable address: string;
	@observable email: string | null;
	defaultFeedId: string;
	@observable private __plan: 'none' | 'trial' | 'basic' | 'pro';
	@observable planEndsAt: number;

	@observable inited: boolean;

	constructor(
		id: string,
		address: string,
		email: string | null,
		defaultFeedId: string,
		plan: 'none' | 'trial' | 'basic' | 'pro',
		planEndsAt: number,
		inited: boolean,
	) {
		this.id = id;
		this.address = address;
		this.email = email;
		this.defaultFeedId = defaultFeedId;
		this.__plan = plan;
		this.planEndsAt = planEndsAt;

		this.inited = inited;

		makeObservable(this);
	}

	@computed get name() {
		return this.email || this.address;
	}

	@computed get _plan() {
		return this.__plan;
	}

	set plan(plan: 'none' | 'trial' | 'basic' | 'pro') {
		this.__plan = plan;
	}

	@computed get plan() {
		const now = Math.floor(Date.now() / 1000);
		if (this.planEndsAt < now) {
			return 'none';
		}
		if (this.__plan === 'trial') {
			return 'basic';
		}
		return this.__plan;
	}
}
