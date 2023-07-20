import { PropsWithChildren, useContext, useLayoutEffect, useRef } from 'react';

import { invariant } from '../../utils/assert';
import { useEscPress } from '../../utils/useEscPress';
import { useOutsideClick } from '../../utils/useOutsideClick';
import { PropsWithClassName } from '../props';
import { PopupManagerContext } from './popupManager/popupManager';

interface PopupProps extends PropsWithChildren<{}>, PropsWithClassName {
	align?: (popupElem: HTMLElement) => void;
	onClick?: (e: React.MouseEvent<HTMLElement>) => void;
	closeOnOutsideClick?: boolean;
	customOutsideClickChecker?: (elem: HTMLElement) => boolean;
	onClose?: () => void;
}

export function Popup({
	children,
	className,
	align,
	onClick,
	closeOnOutsideClick,
	customOutsideClickChecker,
	onClose,
}: PopupProps) {
	const rootRef = useRef<HTMLDivElement>(null);

	const popupManagerApi = useContext(PopupManagerContext);
	invariant(popupManagerApi, 'No PopupManager API provided');

	useLayoutEffect(() => {
		function alignPopup() {
			if (rootRef.current) {
				align?.(rootRef.current);
			}
		}

		alignPopup();

		const timer = setInterval(() => alignPopup(), 500);

		window.addEventListener('resize', alignPopup, false);
		window.addEventListener('scroll', alignPopup, false);

		return () => {
			clearInterval(timer);

			window.removeEventListener('resize', alignPopup, false);
			window.removeEventListener('scroll', alignPopup, false);
		};
	}, [align]);

	useOutsideClick(rootRef, customOutsideClickChecker, closeOnOutsideClick ? onClose : undefined);

	useEscPress(onClose);

	return popupManagerApi.createPortal(
		<div
			ref={rootRef}
			className={className}
			onClick={e => {
				/*
				A fix to prevent click-event bubbling:
				https://github.com/facebook/react/issues/11387
				 */
				e.stopPropagation();

				onClick?.(e);
			}}
		>
			{children}
		</div>,
	);
}
