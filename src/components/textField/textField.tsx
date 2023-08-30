import clsx from 'clsx';
import { forwardRef, InputHTMLAttributes, KeyboardEventHandler, Ref } from 'react';

import css from './textField.module.scss';

export enum TextFieldLook {
	DEFAULT,
	PROMO,
	LITE,
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	look?: TextFieldLook;
	isError?: boolean;
	onValueChange?: (value: string) => void;
	onEnter?: KeyboardEventHandler;
}

export const TextField = forwardRef(
	(
		{ className, look, isError, onValueChange, onKeyDown, onEnter, ...props }: TextFieldProps,
		ref: Ref<HTMLInputElement>,
	) => {
		const lookClass = {
			[TextFieldLook.DEFAULT]: css.root_defaultLook,
			[TextFieldLook.PROMO]: css.root_promoLook,
			[TextFieldLook.LITE]: css.root_liteLook,
		}[look || TextFieldLook.DEFAULT];

		return (
			<input
				ref={ref}
				className={clsx(css.root, lookClass, isError && css.root_error, className)}
				onChange={e => {
					props.onChange?.(e);
					onValueChange?.(e.target.value);
				}}
				onKeyDown={e => {
					onKeyDown?.(e);

					if (e.keyCode === 13) {
						onEnter?.(e);
					}
				}}
				{...props}
			/>
		);
	},
);
