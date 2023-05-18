import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { PropsWithClassName } from '../props';
import css from './errorMessage.module.scss';

export enum ErrorMessageLook {
	ERROR = 'ERROR',
	INFO = 'INFO',
}

export interface ErrorMessageProps extends PropsWithChildren<{}>, PropsWithClassName {
	look?: ErrorMessageLook;
}

export function ErrorMessage({ children, className, look }: ErrorMessageProps) {
	const lookClass = {
		[ErrorMessageLook.ERROR]: css.root_errorLook,
		[ErrorMessageLook.INFO]: css.root_infoLook,
	}[look || ErrorMessageLook.ERROR];

	return <div className={clsx(css.root, lookClass, className)}>{children}</div>;
}
