import clsx from 'clsx';
import { ButtonHTMLAttributes, forwardRef, PropsWithChildren, ReactNode, Ref } from 'react';

import { PropsWithClassName } from '../props';
import { Spinner } from '../spinner/spinner';
import css from './ActionButton.module.scss';

export enum ActionButtonSize {
	SMALL = 'SMALL',
	MEDIUM = 'MEDIUM',
	LARGE = 'LARGE',
	XLARGE = 'XLARGE',
}

export enum ActionButtonLook {
	DEFAULT = 'DEFAULT',
	PRIMARY = 'PRIMARY',
	SECONDARY = 'SECONDARY',
	DANGEROUS = 'DANGEROUS',
	LITE = 'LITE',
}

interface ActionButtonProps extends PropsWithChildren<{}>, PropsWithClassName, ButtonHTMLAttributes<HTMLButtonElement> {
	size?: ActionButtonSize;
	look?: ActionButtonLook;
	icon?: ReactNode;
	isSingleLine?: boolean;
	isDisabled?: boolean;
	isLoading?: boolean;
}

export const ActionButton = forwardRef(
	(
		{ children, className, size, look, icon, isSingleLine, isDisabled, isLoading, ...props }: ActionButtonProps,
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
					(isDisabled || isLoading) && css.root_disabled,
					isSingleLine && css.root_singleline,
					isLoading && css.root_loading,
					className,
				)}
				disabled={isDisabled || isLoading}
				{...props}
			>
				{icon && <div className={css.icon}>{icon}</div>}
				{children != null && <div className={css.content}>{children}</div>}
				{isLoading && <Spinner className={css.loader} />}
			</button>
		);
	},
);
