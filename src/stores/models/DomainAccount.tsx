export interface IDomainAccount {
	id: string;
	address: string;
	email: string | null;
	defaultFeedId: string;
	plan: 'none' | 'trial' | 'basic' | 'pro';
	planEndsAt: number;

	token: string;
}

export class DomainAccount implements IDomainAccount {
	id: string;
	address: string;
	email: string | null;
	defaultFeedId: string;
	private _plan: 'none' | 'trial' | 'basic' | 'pro';
	planEndsAt: number;

	token: string;

	constructor(
		id: string,
		address: string,
		email: string | null,
		defaultFeedId: string,
		plan: 'none' | 'trial' | 'basic' | 'pro',
		planEndsAt: number,
		token: string,
	) {
		this.id = id;
		this.address = address;
		this.email = email;
		this.defaultFeedId = defaultFeedId;
		this._plan = plan;
		this.planEndsAt = planEndsAt;
		this.token = token;
	}

	get name() {
		return this.email || this.address;
	}

	get plan() {
		const now = Math.floor(Date.now() / 1000);
		if (this.planEndsAt < now) {
			return 'none';
		}
		if (this._plan === 'trial') {
			return 'basic';
		}
		return this._plan;
	}
}
