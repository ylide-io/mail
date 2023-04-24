import clsx from 'clsx';
import { ReactNode, useCallback, useRef, useState } from 'react';

import { ReactComponent as ArrowDownSvg } from '../../icons/ic20/arrowDown.svg';
import { HorizontalAlignment } from '../../utils/alignment';
import { DropDown } from '../dropDown/dropDown';
import { PropsWithClassName } from '../props';
import css from './select.module.scss';

export interface SelectProps extends PropsWithClassName {
	children?: (onSelect: () => void) => ReactNode;
	placeholder?: ReactNode;
	text?: ReactNode;
}

export function Select({ children, className, placeholder, text }: SelectProps) {
	const rootRef = useRef(null);
	const [isOpen, setOpen] = useState(false);

	const onSelect = useCallback(() => setOpen(false), []);

	return (
		<>
			<button ref={rootRef} className={clsx(css.button, className)} onClick={() => setOpen(!isOpen)}>
				<div className={css.buttonText}>{text != null ? text : placeholder}</div>

				<ArrowDownSvg className={css.buttonArrow} />
			</button>

			{isOpen && (
				<DropDown
					className={css.dropDown}
					anchorRef={rootRef}
					horizontalAlign={HorizontalAlignment.MATCH}
					onCloseRequest={() => setOpen(false)}
				>
					{children?.(onSelect)}
				</DropDown>
			)}
		</>
	);
}
