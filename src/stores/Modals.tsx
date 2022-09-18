import { makeAutoObservable, observable } from 'mobx';
import { Fragment } from 'react';

export type ModalRenderingFunction = (close: () => void) => JSX.Element;

class Modals {
	passwordModalVisible: boolean = false;
	passwordModalReason: string = '';
	passwordModalHandler: (password: string | null) => void = () => {};

	@observable elements: Set<ModalRenderingFunction> = new Set();

	get anyModalVisible() {
		return this.passwordModalVisible;
	}

	constructor() {
		makeAutoObservable(this);
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
