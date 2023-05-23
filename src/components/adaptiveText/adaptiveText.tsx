import useResizeObserver from '@react-hook/resize-observer';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { truncateInMiddle } from '../../utils/string';
import { PropsWithClassName } from '../props';
import css from './adaptiveText.module.scss';

interface AdaptiveTextProps extends PropsWithClassName {
	text: string;
	textAlign?: 'left' | 'right';
	title?: string;
}

export function AdaptiveText({ className, text, textAlign = 'left', title, ...props }: AdaptiveTextProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	const visibleRef = useRef<HTMLDivElement>(null);

	const [size, setSize] = useState({ scrollWidth: 0, clientWidth: 0 });

	useResizeObserver(rootRef, () => {
		const rootElem = rootRef.current;
		const scrollWidth = rootElem?.scrollWidth || 0;
		const clientWidth = rootElem?.clientWidth || 0;

		setSize({
			scrollWidth,
			clientWidth,
		});
	});

	useEffect(() => {
		const scrollWidth = size.scrollWidth;
		const clientWidth = size.clientWidth;
		if (!scrollWidth || !clientWidth) return;

		const visibleElem = visibleRef.current;
		if (!visibleElem) return;

		visibleElem.innerText = text;

		let removeCounter = 3;
		while (removeCounter < text.length && visibleElem.clientWidth > clientWidth) {
			visibleElem.innerText = truncateInMiddle(text, text.length - removeCounter, '..');
			removeCounter++;
		}
	}, [text, size.clientWidth, size.scrollWidth]);

	return (
		<div
			ref={rootRef}
			className={clsx(css.root, textAlign === 'left' ? css.textAlignLeft : css.textAlignRight, className)}
			title={title}
			{...props}
		>
			<div className={css.invisible}>{text}</div>
			<div ref={visibleRef} className={css.visible}>
				{text}
			</div>
		</div>
	);
}
