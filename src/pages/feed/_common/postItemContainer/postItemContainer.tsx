import clsx from 'clsx';
import React, { MouseEventHandler, PropsWithChildren, useEffect, useRef, useState } from 'react';

import { PropsWithClassName } from '../../../../components/props';
import css from './postItemContainer.module.scss';

export interface PostItemContainerProps extends PropsWithChildren<{}>, PropsWithClassName {
	isCompact?: boolean;
	isCollapsable?: boolean;
	onClick?: MouseEventHandler<HTMLDivElement>;
}

export function PostItemContainer({ children, className, isCompact, isCollapsable, onClick }: PostItemContainerProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	const [collapsed, setCollapsed] = useState(false);

	useEffect(() => {
		if (isCollapsable && rootRef.current && rootRef.current.getBoundingClientRect().height > 600) {
			setCollapsed(true);
		}
	}, [isCollapsable]);

	return (
		<div
			ref={rootRef}
			onClick={onClick}
			className={clsx(css.root, isCompact && css.root_compact, collapsed && css.root_collapsed, className)}
		>
			{children}

			{collapsed && (
				<button className={css.readMore} onClick={() => setCollapsed(false)}>
					Read more
				</button>
			)}
		</div>
	);
}
