import { PropsWithChildren, ReactNode } from 'react';

import { GenericLayout } from '../../../../components/genericLayout/genericLayout';
import css from './otcLayout.module.scss';

export interface OtcLayoutProps extends PropsWithChildren {
	title: ReactNode;
	titleRight?: ReactNode;
	aside: ReactNode;
}

export function OtcLayout({ children, title, titleRight, aside }: OtcLayoutProps) {
	return (
		<GenericLayout isCustomContent>
			<div className={css.root}>
				<div className={css.title}>
					<div className={css.titleText}>{title}</div>
					<div className={css.titleActions}>{titleRight}</div>
				</div>

				<div className={css.aside}>{aside}</div>

				<div className={css.main}>{children}</div>
			</div>
		</GenericLayout>
	);
}
