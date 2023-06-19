import { useEffect, useState } from 'react';

let isShiftPressedGlobal = false;

window.addEventListener('keydown', e => {
	if (e.shiftKey) {
		isShiftPressedGlobal = true;
	}
});

window.addEventListener('keyup', e => {
	if (!e.shiftKey) {
		isShiftPressedGlobal = false;
	}
});

export function useShiftPressed() {
	const [isShiftPressed, setShiftPressed] = useState(isShiftPressedGlobal);

	useEffect(() => {
		const downHandler = (e: KeyboardEvent) => {
			if (e.key === 'Shift') {
				setShiftPressed(true);
			}
		};
		const upHandler = (e: KeyboardEvent) => {
			if (e.key === 'Shift') {
				setShiftPressed(false);
			}
		};
		window.addEventListener('keydown', downHandler);
		window.addEventListener('keyup', upHandler);
		return () => {
			window.removeEventListener('keydown', downHandler);
			window.removeEventListener('keyup', upHandler);
		};
	}, []);

	return isShiftPressed;
}
