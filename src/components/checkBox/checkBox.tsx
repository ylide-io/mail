import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { PropsWithClassName } from '../props';
import css from './checkBox.module.scss';
import { ReactComponent as TickSvg } from './tick.svg';

export enum CheckBoxSize {
	SMALL = 'SMALL',
	MEDIUM = 'MEDIUM',
}

export interface CheckBoxProps extends PropsWithChildren<{}>, PropsWithClassName {
	size?: CheckBoxSize;
	isDisabled?: boolean;
	isChecked?: boolean;
	onChange?: (isChecked: boolean) => void;
}

export function CheckBox({
	size = CheckBoxSize.MEDIUM,
	children,
	className,
	isDisabled,
	isChecked,
	onChange,
}: CheckBoxProps) {
	return (
		<label
			className={clsx(
				css.root,
				isDisabled && css.root_disabled,
				isChecked ? css.root_checked : css.root_unchecked,
				size === CheckBoxSize.SMALL && css.root_smallSize,
				className,
			)}
			onClick={e => e.stopPropagation()}
		>
			<div className={css.checkBox}>
				<input
					className={css.input}
					type="checkbox"
					disabled={isDisabled}
					checked={isChecked}
					onChange={e => onChange?.(e.target.checked)}
				/>

				<div className={css.view}>{isChecked && <TickSvg />}</div>
			</div>

			{children != null && <div>{children}</div>}
		</label>
	);
}
