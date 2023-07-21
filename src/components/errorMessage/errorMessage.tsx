import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { PropsWithClassName, PropsWithCSSStyle } from '../props';
import css from './errorMessage.module.scss';

export enum ErrorMessageLook {
	ERROR = 'ERROR',
	INFO = 'INFO',
}

export interface ErrorMessageProps extends PropsWithChildren<{}>, PropsWithClassName, PropsWithCSSStyle {
	look?: ErrorMessageLook;
}

export function ErrorMessage({ children, className, style, look }: ErrorMessageProps) {
	const lookClass = {
		[ErrorMessageLook.ERROR]: css.root_errorLook,
		[ErrorMessageLook.INFO]: css.root_infoLook,
	}[look || ErrorMessageLook.ERROR];

	return (
		<div className={clsx(css.root, lookClass, className)} style={style}>
			{children}
		</div>
	);
}
