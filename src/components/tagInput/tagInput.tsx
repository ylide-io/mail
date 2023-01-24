import clsx from 'clsx';
import { forwardRef, KeyboardEvent, PropsWithChildren, Ref, useRef, useState } from 'react';

import { ReactComponent as CrossSvg } from '../../icons/cross.svg';
import { PropsWithClassName } from '../propsWithClassName';
import css from './tagInput.module.scss';

export enum TagInputItemStyle {
	DEFAULT,
	LOADING,
	ERROR,
	SUCCESS,
}

interface TagInputItemProps extends PropsWithChildren, PropsWithClassName {
	style?: TagInputItemStyle;
	onRemove?: () => void;
}

export function TagInputItem({ children, className, style, onRemove, ...props }: TagInputItemProps) {
	const styleClass = {
		[TagInputItemStyle.DEFAULT]: css.tag_default,
		[TagInputItemStyle.LOADING]: css.tag_loading,
		[TagInputItemStyle.ERROR]: css.tag_error,
		[TagInputItemStyle.SUCCESS]: css.tag_success,
	}[style || TagInputItemStyle.DEFAULT];

	return (
		<div className={clsx(css.tag, styleClass, className)} onMouseUp={e => e.stopPropagation()} {...props}>
			<div className={css.tagContent}>{children}</div>

			{onRemove && (
				<button
					className={css.tagRemoveButton}
					title="Remove"
					onMouseDown={e => e.preventDefault()}
					onClick={() => onRemove()}
				>
					<CrossSvg />
				</button>
			)}
		</div>
	);
}

//

interface TagInputProps extends PropsWithChildren, PropsWithClassName {
	placeholder?: string;
	search?: string;
	onSearchChange?: (search: string) => void;
	onFocus?: () => void;
	onBlur?: () => void;
	onEnterKey?: (event: KeyboardEvent<HTMLInputElement>) => void;
	onTabKey?: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export const TagInput = forwardRef(
	(
		{
			children,
			className,
			placeholder,
			search,
			onSearchChange,
			onFocus,
			onBlur,
			onEnterKey,
			onTabKey,
		}: TagInputProps,
		ref: Ref<HTMLDivElement>,
	) => {
		const inputRef = useRef<HTMLInputElement>(null);

		const [isFocused, setFocused] = useState(false);

		return (
			<div
				ref={ref}
				className={clsx(css.root, isFocused && css.root_focused, className)}
				onMouseUp={() => inputRef.current?.focus()}
			>
				{children}

				<input
					ref={inputRef}
					className={css.input}
					placeholder={placeholder}
					value={search}
					onChange={e => onSearchChange?.(e.target.value)}
					onFocus={() => {
						setFocused(true);
						onFocus?.();
					}}
					onBlur={() => {
						setFocused(false);
						onBlur?.();
					}}
					onKeyDown={e => {
						// enter
						if (e.keyCode === 13) {
							onEnterKey?.(e);
						}

						// tab
						if (e.keyCode === 9) {
							onTabKey?.(e);
						}
					}}
				/>
			</div>
		);
	},
);
