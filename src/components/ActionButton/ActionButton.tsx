import clsx from 'clsx';
import React, { PropsWithChildren, ReactNode } from 'react';

import { PropsWithClassName } from '../propsWithClassName';
import css from './ActionButton.module.scss';

export enum ActionButtonStyle {
	Default,
	Primary,
	Dengerous,
	Lite,
}

interface ActionButtonProps extends PropsWithChildren, PropsWithClassName {
	style?: ActionButtonStyle;
	icon?: ReactNode;
	title?: string;
	isDisabled?: boolean;
	onClick?: React.MouseEventHandler<HTMLElement>;
}

// 'props' are needed to let AntD show Tooltips https://github.com/ant-design/ant-design/issues/15909
export function ActionButton({
	children,
	className,
	style,
	icon,
	title,
	isDisabled,
	onClick,
	...props
}: ActionButtonProps) {
	const styleClass = {
		[ActionButtonStyle.Default]: css.root_default,
		[ActionButtonStyle.Primary]: css.root_primary,
		[ActionButtonStyle.Dengerous]: css.root_dangerous,
		[ActionButtonStyle.Lite]: css.root_lite,
	}[style || ActionButtonStyle.Default];

	return (
		<button
			className={clsx(
				css.root,
				styleClass,
				icon != null && css.root_hasIcon,
				children != null && css.root_hasContent,
				isDisabled && css.root_disabled,
				className,
			)}
			disabled={isDisabled}
			title={title}
			onClick={onClick}
			{...props}
		>
			{icon}
			{children != null && <div className={css.content}>{children}</div>}
		</button>
	);
}
