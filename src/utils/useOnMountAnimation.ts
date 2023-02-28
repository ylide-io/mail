import { useEffect, useState } from 'react';

/*
Helper for running on-mount animations.

Care should be taken when using a transition immediately after:
- adding the element to the DOM using .appendChild()
- removing an element's display: none; property.
This is treated as if the initial state had never occurred and the element was always in its final state.
The easy way to overcome this limitation is to apply a window.setTimeout()
of a handful of milliseconds before changing the CSS property you intend to transition to.
https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions#javascript_examples

https://stackoverflow.com/q/53999904/4899346
 */
export function useOnMountAnimation() {
	const [isMount, setMount] = useState(false);

	useEffect(() => {
		const raf = requestAnimationFrame(() => setMount(true));

		return () => cancelAnimationFrame(raf);
	}, []);

	return isMount;
}
