import makeBlockie from 'ethereum-blockies-base64';
import { useEffect, useState } from 'react';

import { PropsWithClassName, PropsWithCSSStyle } from '../props';

interface BlockieProps extends PropsWithClassName, PropsWithCSSStyle {
	address: string;
}

export function Blockie({ className, style, address }: BlockieProps) {
	const [url, setUrl] = useState('');

	useEffect(() => {
		setUrl(makeBlockie(address));
	}, [address]);

	return <img className={className} src={url} alt="Blockie img" style={{ borderRadius: '50%', ...style }} />;
}
