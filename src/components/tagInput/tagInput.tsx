import clsx from 'clsx';
import { PropsWithChildren, useRef, useState } from 'react';

import { ReactComponent as CrossSvg } from '../../icons/cross.svg';
import { PropsWithClassName } from '../propsWithClassName';
import css from './tagInput.module.scss';

enum TagStyle {
	DEFAULT,
	LOADING,
	ERROR,
	SUCCESS,
}

interface TagProps extends PropsWithChildren, PropsWithClassName {
	style?: TagStyle;
}

function Tag({ children, className, style }: TagProps) {
	const styleClass = {
		[TagStyle.DEFAULT]: css.tag_default,
		[TagStyle.LOADING]: css.tag_loading,
		[TagStyle.ERROR]: css.tag_error,
		[TagStyle.SUCCESS]: css.tag_success,
	}[style || TagStyle.DEFAULT];

	return (
		<div className={clsx(css.tag, styleClass, className)} onMouseUp={e => e.stopPropagation()}>
			<div className={css.tagContent}>{children}</div>

			<button className={css.tagRemoveButton} title="Remove">
				<CrossSvg />
			</button>
		</div>
	);
}

//

export interface TagInputProps extends PropsWithChildren, PropsWithClassName {
	placeholder?: string;
	search?: string;
	onSearchChange?: (search: string) => void;
	onFocus?: () => void;
	onBlur?: () => void;
	onEnter?: () => void;
}

export function TagInput({
	children,
	className,
	placeholder,
	search,
	onSearchChange,
	onFocus,
	onBlur,
	onEnter,
}: TagInputProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const [isFocused, setFocused] = useState(false);

	return (
		<div
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
					// enter, tab
					if (e.keyCode === 13 || e.keyCode === 9) {
						if (e.currentTarget.value) {
							e.preventDefault();
							onEnter?.();
						}
					}
				}}
			/>
		</div>
	);
}

TagInput.Tag = Tag;
