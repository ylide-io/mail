import { PropsWithChildren, ReactNode } from 'react';

import css from './narrowContent.module.scss';

export interface NarrowContentProps extends PropsWithChildren<{}> {
	title: ReactNode;
	titleSubItem?: ReactNode;
	titleRight?: ReactNode;
}

export function NarrowContent({ children, title, titleSubItem, titleRight }: NarrowContentProps) {
	return (
		<div className={css.root}>
			<div className={css.main}>
				<div className={css.header}>
					<div className={css.title}>
						<div className={css.titleText}>{title}</div>

						{titleSubItem}
					</div>

					{titleRight != null && <div className={css.titleRight}>{titleRight}</div>}
				</div>

				<div>{children}</div>
			</div>
		</div>
	);
}
