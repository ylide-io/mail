import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { PropsWithClassName } from '../props';
import css from './checkBox.module.scss';
import { ReactComponent as TickSvg } from './tick.svg';

export interface CheckBoxProps extends PropsWithChildren<{}>, PropsWithClassName {
	isDisabled?: boolean;
	isChecked?: boolean;
	onChange?: (isChecked: boolean) => void;
}

export function CheckBox({ children, className, isDisabled, isChecked, onChange }: CheckBoxProps) {
	const checkBox = (
		<label
			className={clsx(
				css.root,
				isDisabled && css.root_disabled,
				isChecked ? css.root_checked : css.root_regular,
				className,
			)}
			onClick={e => e.stopPropagation()}
		>
			<input
				className={css.input}
				type="checkbox"
				disabled={isDisabled}
				checked={isChecked}
				onChange={e => onChange?.(e.target.checked)}
			/>

			<div className={css.view}>{isChecked && <TickSvg />}</div>
		</label>
	);

	return children != null ? (
		<label className={css.wrapper}>
			{checkBox} {children}
		</label>
	) : (
		checkBox
	);
}
