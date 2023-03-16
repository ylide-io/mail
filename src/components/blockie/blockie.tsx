import makeBlockie from 'ethereum-blockies-base64';
import { useEffect, useState } from 'react';

import { PropsWithClassName } from '../propsWithClassName';

interface BlockieProps extends PropsWithClassName {
	address: string;
}

export function Blockie({ className, address }: BlockieProps) {
	const [url, setUrl] = useState('');

	useEffect(() => {
		setUrl(makeBlockie(address));
	}, [address]);

	return <img className={className} src={url} alt="Blockie img" style={{ borderRadius: '50%' }} />;
}
