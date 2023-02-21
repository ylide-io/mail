import clsx from 'clsx';
import React, { ButtonHTMLAttributes, forwardRef, PropsWithChildren, ReactNode, Ref } from 'react';

import { PropsWithClassName } from '../propsWithClassName';
import css from './ActionButton.module.scss';

export enum ActionButtonSize {
	Small,
	Medium,
	Large,
}

export enum ActionButtonLook {
	DEFAULT,
	PRIMARY,
	DENGEROUS,
	LITE,
}

interface ActionButtonProps extends PropsWithChildren, PropsWithClassName, ButtonHTMLAttributes<HTMLButtonElement> {
	size?: ActionButtonSize;
	look?: ActionButtonLook;
	icon?: ReactNode;
	isDisabled?: boolean;
	isMultiline?: boolean;
}

export const ActionButton = forwardRef(
	(
		{ children, className, size, look, icon, isDisabled, isMultiline, ...props }: ActionButtonProps,
		ref: Ref<HTMLButtonElement>,
	) => {
		const sizeClass = {
			[ActionButtonSize.Small]: css.root_smallSize,
			[ActionButtonSize.Medium]: css.root_mediumSize,
			[ActionButtonSize.Large]: css.root_largeSize,
		}[size || ActionButtonSize.Small];

		const lookClass = {
			[ActionButtonLook.DEFAULT]: css.root_defaultLook,
			[ActionButtonLook.PRIMARY]: css.root_primaryLook,
			[ActionButtonLook.DENGEROUS]: css.root_dangerousLook,
			[ActionButtonLook.LITE]: css.root_liteLook,
		}[look || ActionButtonLook.DEFAULT];

		return (
			<button
				ref={ref}
				className={clsx(
					css.root,
					sizeClass,
					lookClass,
					icon != null && css.root_hasIcon,
					children != null && css.root_hasContent,
					isDisabled && css.root_disabled,
					isMultiline ? css.root_multiline : css.root_singleline,
					className,
				)}
				disabled={isDisabled}
				{...props}
			>
				{icon && <div className={css.icon}>{icon}</div>}
				{children != null && <div className={css.content}>{children}</div>}
			</button>
		);
	},
);
