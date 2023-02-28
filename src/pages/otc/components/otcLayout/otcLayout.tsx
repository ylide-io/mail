import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';

import { GenericLayout } from '../../../../components/genericLayout/genericLayout';
import css from './otcLayout.module.scss';

export interface OtcLayoutProps extends PropsWithChildren {
	title: ReactNode;
	titleRight?: ReactNode;
	aside?: ReactNode;
	supContent?: ReactNode;
	contentClass?: string;
}

export function OtcLayout({ children, title, titleRight, aside, supContent, contentClass }: OtcLayoutProps) {
	return (
		<GenericLayout isCustomContent mainClass={css.root}>
			<div className={css.main}>
				<div className={css.title}>
					<div className={css.titleText}>{title}</div>
					<div className={css.titleActions}>{titleRight}</div>
				</div>

				<div className={css.aside}>{aside}</div>

				<div className={css.body}>
					{supContent != null && <div className={css.supContent}>{supContent}</div>}

					<div className={clsx(css.content, contentClass)}>{children}</div>
				</div>
			</div>
		</GenericLayout>
	);
}
