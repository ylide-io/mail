import useResizeObserver from '@react-hook/resize-observer';
import clsx from 'clsx';
import { HTMLAttributes, useEffect, useRef, useState } from 'react';

import { truncateInMiddle } from '../../utils/string';
import { PropsWithClassName } from '../props';
import css from './adaptiveText.module.scss';

interface AdaptiveTextProps extends PropsWithClassName, HTMLAttributes<HTMLDivElement> {
	contentClassName?: string;
	text: string;
	maxLength?: number;
	separator?: string;
	textAlign?: 'left' | 'right';
	title?: string;
}

export function AdaptiveText({
	className,
	contentClassName,
	text,
	textAlign = 'left',
	title,
	maxLength: maxLengthRaw,
	separator: separatorRaw,
	...props
}: AdaptiveTextProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	const visibleRef = useRef<HTMLDivElement>(null);

	const separator = separatorRaw != null ? separatorRaw : '..';
	const maxLength = maxLengthRaw || text.length;

	const initialText = truncateInMiddle(text, maxLength, separator);

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

		visibleElem.innerText = initialText;

		let removeCounter = Math.max(separator.length + 1, text.length - maxLength);
		while (removeCounter < text.length && visibleElem.clientWidth > clientWidth) {
			visibleElem.innerText = truncateInMiddle(text, text.length - removeCounter, separator);
			removeCounter++;
		}
	}, [initialText, maxLength, separator, size.clientWidth, size.scrollWidth, text]);

	return (
		<div
			{...props}
			ref={rootRef}
			className={clsx(
				css.root,
				textAlign === 'left' ? css.root_textAlignLeft : css.root_textAlignRight,
				className,
			)}
			title={title}
		>
			<div className={css.invisible}>{initialText}</div>
			<div ref={visibleRef} className={clsx(css.visible, contentClassName)}>
				{initialText}
			</div>
		</div>
	);
}
