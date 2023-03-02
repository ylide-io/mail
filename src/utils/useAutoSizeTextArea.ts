import { RefObject, useEffect } from 'react';

export function useAutoSizeTextArea(textareaRef: RefObject<HTMLTextAreaElement>, value: string, maxHeight?: number) {
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
	}, [maxHeight, textareaRef, value]);
}
