import { forwardRef, Ref, RefObject, TextareaHTMLAttributes, useEffect, useImperativeHandle, useRef } from 'react';

export function useAutoSizeTextArea({
	textareaRef,
	value,
	maxHeight,
	resetKey,
}: {
	textareaRef: RefObject<HTMLTextAreaElement>;
	value?: string;
	maxHeight?: number;
	resetKey?: any;
}) {
	useEffect(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = '';

			const scrollHeight = textarea.scrollHeight;
			const paddingCompensation = textarea.offsetHeight - textarea.clientHeight;

			textarea.style.height = `${Math.min(
				scrollHeight + paddingCompensation,
				maxHeight || Number.MAX_SAFE_INTEGER,
			)}px`;
		}
	}, [maxHeight, textareaRef, value, resetKey]);
}

export interface AutoSizeTextAreaApi {
	focus: () => void;
}

interface AutoSizeTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	resetKey?: any;
	maxHeight?: number;
	value?: string;
	onChangeValue?: (value: string) => void;
}

export const AutoSizeTextArea = forwardRef(
	({ resetKey, maxHeight, value, onChangeValue, ...props }: AutoSizeTextAreaProps, ref: Ref<AutoSizeTextAreaApi>) => {
		const textareaRef = useRef<HTMLTextAreaElement>(null);
		useAutoSizeTextArea({ textareaRef, value, maxHeight, resetKey });

		useImperativeHandle(ref, () => ({
			focus: () => textareaRef.current?.focus(),
		}));

		return (
			<textarea
				ref={textareaRef}
				{...props}
				value={value}
				onChange={e => {
					onChangeValue?.(e.target.value);
					props.onChange?.(e);
				}}
			/>
		);
	},
);
