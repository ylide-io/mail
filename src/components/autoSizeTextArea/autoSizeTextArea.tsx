import { RefObject, TextareaHTMLAttributes, useEffect, useRef } from 'react';

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

interface AutoSizeTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	resetKey?: any;
	maxHeight?: number;
	value?: string;
	onChangeValue?: (value: string) => void;
}

export function AutoSizeTextArea({ resetKey, maxHeight, value, onChangeValue, ...props }: AutoSizeTextAreaProps) {
	const textareaRef = useRef(null);
	useAutoSizeTextArea({ textareaRef, value, maxHeight, resetKey });

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
}
