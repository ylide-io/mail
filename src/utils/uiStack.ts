import { makeAutoObservable } from 'mobx';
import { ReactNode } from 'react';

export enum UiStackItemState {
	SHOWING = 'SHOWING',
	SHOWN = 'SHOWN',
	HIDING = 'HIDING',
}

export interface UiStackItem<Data> {
	id: number;
	state: UiStackItemState;
	data: Data;
}

export class UiStack<Data = ReactNode> {
	stack: UiStackItem<Data>[] = [];

	private idCounter = 0;

	constructor(
		private options: {
			displayTime: number;
			hidingTime: number;
		},
	) {
		makeAutoObservable(this);
	}

	push(data: Data) {
		const stack = this.stack;
		const id = ++this.idCounter;

		// Hide previous
		stack.forEach(it => {
			it.state = UiStackItemState.HIDING;
		});

		// Add new
		stack.push({ id, data, state: UiStackItemState.SHOWING });

		// Make visible with short delay for on-mount animation
		setTimeout(
			() =>
				stack.forEach(it => {
					if (it.id === id && it.state === UiStackItemState.SHOWING) {
						it.state = UiStackItemState.SHOWN;
					}
				}),
			100,
		);

		// Hide after timeout
		setTimeout(() => this.hide(id), this.options.displayTime);

		// Remove item
		setTimeout(() => {
			const idx = stack.findIndex(it => it.id === id);
			idx >= 0 && stack.splice(idx, 1);
		}, this.options.displayTime + this.options.hidingTime);

		return id;
	}

	hide(id: number) {
		this.stack.forEach(it => {
			if (it.id === id && it.state === UiStackItemState.SHOWN) {
				it.state = UiStackItemState.HIDING;
			}
		});
	}
}
