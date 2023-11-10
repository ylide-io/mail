import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';

import css from './narrowContent.module.scss';

export interface NarrowContentProps extends PropsWithChildren {
	title?: ReactNode;
	titleSubItem?: ReactNode;
	titleRight?: ReactNode;
	contentClassName?: string;
}

export function NarrowContent({ children, title, titleSubItem, titleRight, contentClassName }: NarrowContentProps) {
	return (
		<div className={css.root}>
			{title != null && (
				<div className={css.header}>
					<div className={css.title}>
						<div className={css.titleText}>{title}</div>

						{titleSubItem}
					</div>

					{titleRight != null && <div className={css.titleRight}>{titleRight}</div>}
				</div>
			)}

			<div className={clsx(css.content, contentClassName)}>{children}</div>
		</div>
	);
}
