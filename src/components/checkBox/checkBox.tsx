import clsx from 'clsx';

import { ReactComponent as TickSvg } from '../../assets/img/tick.svg';
import css from './checkBox.module.scss';

export interface CheckBoxProps {
	isChecked?: boolean;
	onChange?: (isChecked: boolean) => void;
}

export function CheckBox({ isChecked, onChange }: CheckBoxProps) {
	return (
		<label className={css.root} onClick={e => e.stopPropagation()}>
			<input
				className={css.input}
				type="checkbox"
				checked={isChecked}
				onChange={e => onChange?.(e.target.checked)}
			/>

			<div className={clsx(css.view, isChecked ? css.view_checked : css.view_regular)}>
				{isChecked && <TickSvg />}
			</div>
		</label>
	);
}
