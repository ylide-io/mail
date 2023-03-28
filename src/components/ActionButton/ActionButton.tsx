import clsx from 'clsx';
import React, { ButtonHTMLAttributes, forwardRef, PropsWithChildren, ReactNode, Ref } from 'react';

import { PropsWithClassName } from '../propsWithClassName';
import css from './ActionButton.module.scss';

export enum ActionButtonSize {
	SMALL,
	MEDIUM,
	LARGE,
	XLARGE,
}

export enum ActionButtonLook {
	DEFAULT,
	PRIMARY,
	SECONDARY,
	DANGEROUS,
	LITE,
}

interface ActionButtonProps extends PropsWithChildren<{}>, PropsWithClassName, ButtonHTMLAttributes<HTMLButtonElement> {
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
			[ActionButtonSize.SMALL]: css.root_smallSize,
			[ActionButtonSize.MEDIUM]: css.root_mediumSize,
			[ActionButtonSize.LARGE]: css.root_largeSize,
			[ActionButtonSize.XLARGE]: css.root_xlargeSize,
		}[size || ActionButtonSize.SMALL];

		const lookClass = {
			[ActionButtonLook.DEFAULT]: css.root_defaultLook,
			[ActionButtonLook.PRIMARY]: css.root_primaryLook,
			[ActionButtonLook.SECONDARY]: css.root_secondaryLook,
			[ActionButtonLook.DANGEROUS]: css.root_dangerousLook,
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
