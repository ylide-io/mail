import { computed, makeAutoObservable, observable } from 'mobx';
import { Fragment } from 'react';

export type ModalRenderingFunction = (close: () => void) => JSX.Element;

class Modals {
	@observable elements: Set<ModalRenderingFunction> = new Set();

	constructor() {
		makeAutoObservable(this);
	}

	@computed get anythingVisible() {
		return this.elements.size > 0;
	}

	show(fn: ModalRenderingFunction) {
		this.elements.add(fn);
	}

	render() {
		return [...this.elements.values()].map((fn, idx) => (
			<Fragment key={idx}>{fn(() => this.elements.delete(fn))}</Fragment>
		));
	}
}

const modals = new Modals();
export default modals;
