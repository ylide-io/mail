import { useWeb3Modal } from '@web3modal/wagmi/react';
import { PropsWithChildren, useEffect } from 'react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';

import domain from '../../stores/Domain';

export function AuthContextProvider({ children }: PropsWithChildren) {
	const { address } = useAccount();
	const { disconnect } = useDisconnect();
	const { signMessageAsync } = useSignMessage();
	const { open } = useWeb3Modal();

	console.log('domain._gotAddress', address);
	domain._gotAddress(address);

	useEffect(() => {
		domain._open = open;
	}, [open]);

	useEffect(() => {
		domain._disconnect = disconnect;
	}, [disconnect]);

	useEffect(() => {
		domain._signMessageAsync = signMessageAsync;
	}, [signMessageAsync]);

	return children;
}
