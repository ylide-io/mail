import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { PropsWithClassName } from '../propsWithClassName';
import css from './errorMessage.module.scss';

export interface ErrorMessageProps extends PropsWithChildren, PropsWithClassName {}

export function ErrorMessage({ children, className }: ErrorMessageProps) {
	return <div className={clsx(css.root, className)}>{children}</div>;
}
