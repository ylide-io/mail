import clsx from 'clsx';
import { PropsWithChildren, useLayoutEffect, useRef } from 'react';

import { getElementRect, getViewportRect } from '../../../../utils/ui';
import { PropsWithClassName } from '../../../props';
import css from './fullPageContent.module.scss';

export interface FullPageContentProps extends PropsWithChildren<{}>, PropsWithClassName {}

export function FullPageContent({ children, className }: FullPageContentProps) {
	const rootRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const adjustHeight = () => {
			const root = rootRef.current;
			if (!root) return;

			const viewportRect = getViewportRect();
			const rootRect = getElementRect(root);

			root.style.height = `${viewportRect.height - rootRect.y}px`;
		};

		adjustHeight();

		document.addEventListener('scroll', adjustHeight, true);

		return () => {
			document.removeEventListener('scroll', adjustHeight, true);
		};
	});

	return (
		<div ref={rootRef} className={css.root}>
			<div className={clsx(css.inner, className)}>{children}</div>
		</div>
	);
}
