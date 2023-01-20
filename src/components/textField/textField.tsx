import clsx from 'clsx';
import { forwardRef, Ref } from 'react';

import { PropsWithClassName } from '../propsWithClassName';
import css from './textField.module.scss';

export interface TextFieldProps extends PropsWithClassName {
	isError?: boolean;
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
}

export const TextField = forwardRef(
	(
		{ className, isError, placeholder, value, onChange }: TextFieldProps,
		ref: Ref<HTMLInputElement>, // & HTMLTextAreaElement
	) => (
		<input
			ref={ref}
			className={clsx(css.root, isError && css.root_error, className)}
			placeholder={placeholder}
			value={value}
			onChange={e => onChange?.(e.target.value)}
		/>
	),
);
