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
	icon?: ReactNode;
	style?: ActionButtonStyle;
	onClick?: React.MouseEventHandler<HTMLElement>;
}

// 'props' are needed to let AntD show Tooltips https://github.com/ant-design/ant-design/issues/15909
export function ActionButton({ children, className, icon, style, onClick, ...props }: ActionButtonProps) {
	const styleClass = {
		[ActionButtonStyle.Default]: css.root_default,
		[ActionButtonStyle.Primary]: css.root_primary,
		[ActionButtonStyle.Dengerous]: css.root_dangerous,
	}[style || ActionButtonStyle.Default];

	return (
		<button
			className={clsx(
				css.root,
				styleClass,
				icon != null && css.root_hasIcon,
				children != null && css.root_hasContent,
				className,
			)}
			onClick={onClick}
			{...props}
		>
			{icon}
			{children != null && <div className={css.content}>{children}</div>}
		</button>
	);
}
