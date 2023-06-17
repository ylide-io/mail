import clsx from 'clsx';
import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';

import { PropsWithClassName } from '../../../../components/props';
import css from './postItemContainer.module.scss';

export interface PostItemContainerProps extends PropsWithChildren<{ onClick?: (e: any) => void }>, PropsWithClassName {
	collapsable?: boolean;
}

export function PostItemContainer({ children, className, collapsable, onClick }: PostItemContainerProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	const [collapsed, setCollapsed] = useState(false);

	useEffect(() => {
		if (collapsable && rootRef.current && rootRef.current.getBoundingClientRect().height > 600) {
			setCollapsed(true);
		}
	}, [collapsable]);

	return (
		<div ref={rootRef} onClick={onClick} className={clsx(css.root, collapsed && css.root_collapsed, className)}>
			{children}

			{collapsed && (
				<button className={css.readMore} onClick={() => setCollapsed(false)}>
					Read more
				</button>
			)}
		</div>
	);
}
