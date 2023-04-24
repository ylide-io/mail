import clsx from 'clsx';
import { FocusEvent, forwardRef, KeyboardEvent, PropsWithChildren, Ref, useRef, useState } from 'react';

import { ReactComponent as CrossSvg } from '../../icons/ic20/cross.svg';
import { PropsWithClassName } from '../props';
import css from './tagInput.module.scss';

export enum TagInputItemLook {
	DEFAULT,
	LOADING,
	ERROR,
	SUCCESS,
}

interface TagInputItemProps extends PropsWithChildren<{}>, PropsWithClassName {
	look?: TagInputItemLook;
	onRemove?: () => void;
}

export function TagInputItem({ children, className, look, onRemove, ...props }: TagInputItemProps) {
	const styleClass = {
		[TagInputItemLook.DEFAULT]: css.tag_default,
		[TagInputItemLook.LOADING]: css.tag_loading,
		[TagInputItemLook.ERROR]: css.tag_error,
		[TagInputItemLook.SUCCESS]: css.tag_success,
	}[look || TagInputItemLook.DEFAULT];

	return (
		<div className={clsx(css.tag, styleClass, className)} onMouseUp={e => e.stopPropagation()} {...props}>
			<div className={css.tagContent}>{children}</div>

			{onRemove && (
				<button
					className={css.tagRemoveButton}
					disabled={!onRemove}
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

interface TagInputProps extends PropsWithChildren<{}>, PropsWithClassName {
	isReadOnly?: boolean;
	placeholder?: string;
	search?: string;
	onSearchChange?: (search: string) => void;
	onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
	onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
	onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export const TagInput = forwardRef(
	(
		{
			children,
			className,
			isReadOnly,
			placeholder,
			search,
			onSearchChange,
			onFocus,
			onBlur,
			onKeyDown,
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
					disabled={isReadOnly}
					placeholder={placeholder}
					value={search}
					onChange={e => onSearchChange?.(e.target.value)}
					onFocus={e => {
						setFocused(true);
						onFocus?.(e);
					}}
					onBlur={e => {
						setFocused(false);
						onBlur?.(e);
					}}
					onKeyDown={onKeyDown}
				/>
			</div>
		);
	},
);
