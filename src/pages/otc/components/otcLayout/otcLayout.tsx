import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';

import { GenericLayout } from '../../../../components/genericLayout/genericLayout';
import css from './otcLayout.module.scss';

export interface OtcLayoutProps extends PropsWithChildren {
	title: ReactNode;
	titleRight?: ReactNode;
	aside?: ReactNode;
	contentClass?: string;
}

export function OtcLayout({ children, title, titleRight, aside, contentClass }: OtcLayoutProps) {
	return (
		<GenericLayout isCustomContent mainClass={css.root}>
			<div className={css.main}>
				<div className={css.title}>
					<div className={css.titleText}>{title}</div>
					<div className={css.titleActions}>{titleRight}</div>
				</div>

				<div className={css.aside}>{aside}</div>

				<div className={clsx(css.content, contentClass)}>{children}</div>
			</div>
		</GenericLayout>
	);
}

//

export interface OtcSupContentTitleProps extends PropsWithChildren {}

export function OtcSupContentTitle({ children }: OtcSupContentTitleProps) {
	return <div className={css.supContentTitle}>{children}</div>;
}
