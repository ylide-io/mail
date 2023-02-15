import clsx from 'clsx';
import { forwardRef, HTMLInputTypeAttribute, Ref } from 'react';

import { PropsWithClassName } from '../propsWithClassName';
import css from './textField.module.scss';

export interface TextFieldProps extends PropsWithClassName {
	isError?: boolean;
	autoFocus?: boolean;
	type?: HTMLInputTypeAttribute;
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
}

export const TextField = forwardRef(
	(
		{ className, isError, autoFocus, type, placeholder, value, onChange }: TextFieldProps,
		ref: Ref<HTMLInputElement>,
	) => (
		<input
			ref={ref}
			className={clsx(css.root, isError && css.root_error, className)}
			autoFocus={autoFocus}
			type={type}
			placeholder={placeholder}
			value={value}
			onChange={e => onChange?.(e.target.value)}
		/>
	),
);
