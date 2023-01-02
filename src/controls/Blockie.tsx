import makeBlockie from 'ethereum-blockies-base64';
import { useEffect, useState } from 'react';

export function Blockie({ address, ...rest }: { address: string } & any) {
	const [url, setUrl] = useState('');

	useEffect(() => {
		setUrl(makeBlockie(address));
	}, [address]);

	return <img src={url} alt="Blockie img" style={{ borderRadius: '50%', border: '1px solid white' }} {...rest} />;
}
