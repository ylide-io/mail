import { useEffect } from 'react';

export function useBodyHiddenOverflow(isHidden: boolean) {
	useEffect(() => {
		document.body.style.overflow = isHidden ? 'hidden' : '';
	}, [isHidden]);
}
