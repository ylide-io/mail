import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';

import { GenericLayout } from '../../../../components/genericLayout/genericLayout';
import css from './otcLayout.module.scss';

export interface OtcLayoutProps extends PropsWithChildren<{}> {
	title: ReactNode;
	titleRight?: ReactNode;
	isAsideCentered?: boolean;
	aside?: ReactNode;
	contentClass?: string;
}

export function OtcLayout({ children, title, titleRight, isAsideCentered, aside, contentClass }: OtcLayoutProps) {
	return (
		<GenericLayout>
			<div className={css.root}>
				<div className={css.title}>
					<div className={css.titleText}>{title}</div>
					<div className={css.titleActions}>{titleRight}</div>
				</div>

				<div className={clsx(css.aside, isAsideCentered && css.aside_centered)}>{aside}</div>

				<div className={clsx(css.content, contentClass)}>{children}</div>
			</div>
		</GenericLayout>
	);
}

//

export interface OtcSupContentTitleProps extends PropsWithChildren<{}> {}

export function OtcSupContentTitle({ children }: OtcSupContentTitleProps) {
	return <div className={css.supContentTitle}>{children}</div>;
}
