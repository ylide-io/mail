import clsx from 'clsx';
import React, { forwardRef, PropsWithChildren, ReactNode, Ref } from 'react';

import { PropsWithClassName } from '../propsWithClassName';
import css from './ActionButton.module.scss';

export enum ActionButtonSize {
	Small,
	Medium,
}

export enum ActionButtonStyle {
	Default,
	Primary,
	Dengerous,
	Lite,
}

interface ActionButtonProps extends PropsWithChildren, PropsWithClassName {
	size?: ActionButtonSize;
	style?: ActionButtonStyle;
	icon?: ReactNode;
	title?: string;
	isDisabled?: boolean;
	isMultiline?: boolean;
	onClick?: React.MouseEventHandler<HTMLElement>;
}

export const ActionButton = forwardRef(
	(
		{
			children,
			className,
			size,
			style,
			icon,
			title,
			isDisabled,
			isMultiline,
			onClick,
			...props
		}: ActionButtonProps,
		ref: Ref<HTMLButtonElement>,
	) => {
		const sizeClass = {
			[ActionButtonSize.Small]: css.root_smallSize,
			[ActionButtonSize.Medium]: css.root_mediumSize,
		}[size || ActionButtonSize.Small];

		const styleClass = {
			[ActionButtonStyle.Default]: css.root_defaultStyle,
			[ActionButtonStyle.Primary]: css.root_primaryStyle,
			[ActionButtonStyle.Dengerous]: css.root_dangerousStyle,
			[ActionButtonStyle.Lite]: css.root_liteStyle,
		}[style || ActionButtonStyle.Default];

		return (
			<button
				ref={ref}
				className={clsx(
					css.root,
					sizeClass,
					styleClass,
					icon != null && css.root_hasIcon,
					children != null && css.root_hasContent,
					isDisabled && css.root_disabled,
					isMultiline ? css.root_multiline : css.root_singleline,
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
	},
);
