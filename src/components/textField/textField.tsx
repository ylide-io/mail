import clsx from 'clsx';

import { PropsWithClassName } from '../propsWithClassName';
import css from './textField.module.scss';

export interface TextFieldProps extends PropsWithClassName {
	isError?: boolean;
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
}

export function TextField({ className, isError, placeholder, value, onChange }: TextFieldProps) {
	return (
		<input
			className={clsx(css.root, isError && css.root_error, className)}
			placeholder={placeholder}
			value={value}
			onChange={e => onChange?.(e.target.value)}
		/>
	);
}
