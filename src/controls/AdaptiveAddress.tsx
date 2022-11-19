import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useResizeObserver from '@react-hook/resize-observer';
import { Tooltip } from 'antd';

const useSize = (target: React.RefObject<HTMLElement>) => {
	const [size, setSize] = useState(new DOMRect(0, 0, 0, 0));

	useLayoutEffect(() => {
		if (target.current) {
			setSize(target.current.getBoundingClientRect());
		}
	}, [target]);

	// Where the magic happens
	useResizeObserver(target, entry => setSize(entry.contentRect));
	return size;
};

export function AdaptiveAddress({ address }: { address: string }) {
	const parentRef = useRef<HTMLDivElement>(null);
	const childRef = useRef<HTMLDivElement>(null);
	const [calculated, setCalculated] = useState(false);
	const [visibleLength, setVisibleLength] = useState(address.length);
	const [prefixLength, setPrefixLength] = useState(0);
	const [letterSize, setLetterSize] = useState(0);
	const parentSize = useSize(parentRef);

	const addressLength = address.length;
	const withPrefix = address.includes(':') || address.startsWith('0x');

	useEffect(() => {
		setCalculated(false);
	}, [addressLength, withPrefix]);

	useEffect(() => {
		if (calculated === false) {
			setCalculated(true);
			setLetterSize(childRef.current!.offsetWidth / addressLength);
		} else {
			if (letterSize === 0) {
				// console.log('Something goes wrong in AdaptiveAddress: ', address);
			} else {
				const addressSize = addressLength * letterSize;
				if (addressSize <= parentSize.width) {
					setPrefixLength(0);
					setVisibleLength(addressLength);
					setCalculated(true);
				} else {
					// setPrefixLength(0);
					// setVisibleLength(addressLength);
					// setCalculated(true);
					const pfSize = withPrefix ? 2 : 0;
					const availableSize = parentSize.width - (pfSize + 3) * letterSize;
					const howMuchLettersFit = Math.floor(availableSize / letterSize);
					let tailSize = Math.floor(howMuchLettersFit / 2);
					if (tailSize < 2) {
						tailSize = 2;
					}
					setPrefixLength(pfSize);
					setVisibleLength(tailSize * 2);
					setCalculated(true);
				}
			}
		}
	}, [addressLength, withPrefix, calculated, letterSize, parentSize]);

	return (
		<Tooltip
			title={<div style={{ fontFamily: 'monospace', textAlign: 'center', whiteSpace: 'nowrap' }}>{address}</div>}
		>
			<div className="ylide-address" ref={parentRef}>
				<span ref={childRef} className="ylide-address-value">
					{calculated
						? `${address.substring(0, prefixLength)}${address.substring(
								prefixLength,
								prefixLength + visibleLength / 2,
						  )}${prefixLength + visibleLength < address.length ? '...' : ''}${address.substring(
								address.length - visibleLength / 2,
								address.length,
						  )}`
						: address}
				</span>
			</div>
		</Tooltip>
	);
}
