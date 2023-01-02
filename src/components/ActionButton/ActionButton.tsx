import clsx from 'clsx';
import React, { ReactNode } from 'react';

import { WithChildrenProps } from '../WithChildrenProps';
import { WithClassNameProps } from '../WithClassNameProps';
import css from './ActionButton.module.scss';

export enum ActionButtonStyle {
	Default,
	Dengerous,
	Primary,
}

interface ActionButtonProps extends WithChildrenProps, WithClassNameProps {
	icon: ReactNode;
	style?: ActionButtonStyle;
	onClick?: React.MouseEventHandler<HTMLElement>;
}

export function ActionButton({ children, className, icon, style, onClick }: ActionButtonProps) {
	const styleClass = {
		[ActionButtonStyle.Default]: css.root_default,
		[ActionButtonStyle.Primary]: css.root_primary,
		[ActionButtonStyle.Dengerous]: css.root_dangerous,
	}[style || ActionButtonStyle.Default];

	return (
		<button className={clsx(css.root, styleClass, className)} onClick={onClick}>
			{icon}
			{children != null && <span>{children}</span>}
		</button>
	);
}
