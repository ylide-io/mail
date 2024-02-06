import { makeObservable, observable } from 'mobx';

export class DomainAccount {
	@observable id: string;
	@observable address: string;
	@observable mainviewKey: string;

	constructor(id: string, address: string, mainviewKey: string) {
		this.id = id;
		this.address = address;
		this.mainviewKey = mainviewKey;

		makeObservable(this);
	}
}
