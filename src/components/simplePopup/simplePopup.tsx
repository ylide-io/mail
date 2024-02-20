import clsx from 'clsx';
import { makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import React, { PropsWithChildren, PureComponent } from 'react';

import { HorizontalAlignment } from '../../utils/alignment';
import { AnchoredPopup } from '../popup/anchoredPopup/anchoredPopup';
import css from './simplePopup.module.scss';

@observer
export class SimplePopup extends PureComponent<PropsWithChildren<{ content: React.ReactNode }>> {
	@observable isOpen = false;

	targetRef = React.createRef<HTMLDivElement>();

	constructor(props: PropsWithChildren<{ content: React.ReactNode }>) {
		super(props);

		makeObservable(this);
	}

	render() {
		return (
			<div className={css.simplePopupContainer}>
				<div
					ref={this.targetRef}
					className={css.simplePopupTarget}
					onMouseEnter={() => (this.isOpen = true)}
					onMouseLeave={() => (this.isOpen = false)}
				>
					{this.props.children}
				</div>
				{this.isOpen && (
					<AnchoredPopup
						anchorRef={this.targetRef}
						horizontalAlign={HorizontalAlignment.END}
						className={clsx(css.simplePopupContent, this.isOpen && css.visible)}
					>
						{this.props.content}
					</AnchoredPopup>
				)}
			</div>
		);
	}
}
