import { makeObservable, observable } from 'mobx';

export class DomainAccount {
	@observable address: string;
	@observable mainviewKey: string;

	constructor(address: string, mainviewKey: string) {
		this.address = address;
		this.mainviewKey = mainviewKey;

		makeObservable(this);
	}
}
