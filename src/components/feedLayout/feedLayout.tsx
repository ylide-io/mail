import { PropsWithChildren, ReactNode } from 'react';

import { GenericLayout } from '../genericLayout/genericLayout';
import css from './feedLayout.module.scss';

export interface FeedLayoutProps extends PropsWithChildren {
	title: ReactNode;
	titleSubItem?: ReactNode;
	titleRight?: ReactNode;
}

export function FeedLayout({ children, title, titleSubItem, titleRight }: FeedLayoutProps) {
	return (
		<GenericLayout isCustomContent>
			<div className={css.root}>
				<div className={css.main}>
					<div className={css.header}>
						<div className={css.title}>
							<div className={css.titleText}>{title}</div>

							{titleSubItem}
						</div>

						{titleRight != null && <div className={css.titleRight}>{titleRight}</div>}
					</div>

					<div className={css.content}>{children}</div>
				</div>
			</div>
		</GenericLayout>
	);
}
