import clsx from 'clsx';
import { forwardRef, HTMLAttributes, PropsWithChildren, ReactNode, Ref } from 'react';

import { isExternalUrl, useNav } from '../../utils/url';
import { PropsWithClassName } from '../props';
import { Spinner } from '../spinner/spinner';
import css from './actionButton.module.scss';

export enum ActionButtonSize {
	XSMALL = 'XSMALL',
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
	SUBTILE = 'SUBTILE',
	HEAVY = 'HEAVY',
}

interface ActionButtonProps extends PropsWithChildren, PropsWithClassName, HTMLAttributes<HTMLElement> {
	size?: ActionButtonSize;
	look?: ActionButtonLook;
	icon?: ReactNode;
	href?: string;
	isSingleLine?: boolean;
	isDisabled?: boolean;
	isLoading?: boolean;
}

export const ActionButton = forwardRef(
	(
		{
			children,
			className,
			size,
			look,
			icon,
			href,
			onClick,
			isSingleLine,
			isDisabled,
			isLoading,
			...props
		}: ActionButtonProps,
		ref: Ref<HTMLButtonElement & HTMLAnchorElement>,
	) => {
		const navigate = useNav();

		const sizeClass = {
			[ActionButtonSize.XSMALL]: css.root_xsmallSize,
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
			[ActionButtonLook.SUBTILE]: css.root_subtileLook,
			[ActionButtonLook.HEAVY]: css.root_heavyLook,
		}[look || ActionButtonLook.DEFAULT];

		const Component = href ? 'a' : 'button';
		const externalHref = !!href && isExternalUrl(href);
		const target = externalHref ? '_blank' : undefined;
		const rel = externalHref ? 'noreferrer' : undefined;

		return (
			<Component
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
				href={href}
				target={target}
				rel={rel}
				onClick={e => {
					onClick?.(e);

					if (href && !externalHref) {
						e.preventDefault();
						navigate(href);
					}
				}}
				{...props}
			>
				{icon && <div className={css.icon}>{icon}</div>}
				{children != null && <div className={css.content}>{children}</div>}
				{isLoading && <Spinner className={css.loader} />}
			</Component>
		);
	},
);
