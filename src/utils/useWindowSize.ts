import { useEffect, useState } from 'react';

export function useWindowSize() {
	const [size, setSize] = useState({
		windowWidth: window.visualViewport?.width || window.innerWidth,
		windowHeight: window.visualViewport?.height || window.innerHeight,
	});

	useEffect(() => {
		const f = () => {
			setSize({
				windowWidth: window.visualViewport?.width || window.innerWidth,
				windowHeight: window.visualViewport?.height || window.innerHeight,
			});
		};
		window.addEventListener('resize', f);
		return () => window.removeEventListener('resize', f);
	}, []);

	return size;
}
