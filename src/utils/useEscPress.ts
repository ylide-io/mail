import { useEffect } from 'react';

export function useEscPress(callback?: () => void) {
	useEffect(() => {
		function onDocElemKeyDown(e: KeyboardEvent) {
			if (e.keyCode === 27) callback?.();
		}

		document.documentElement.addEventListener('keydown', onDocElemKeyDown);

		return () => {
			document.documentElement.removeEventListener('keydown', onDocElemKeyDown);
		};
	}, [callback]);
}
