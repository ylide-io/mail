import { PropsWithChildren, useEffect } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';

import domain from '../../stores/Domain';
import { useWeb3Modal } from '@web3modal/wagmi/react';

export function AuthContextProvider({ children }: PropsWithChildren) {
	const { address } = useAccount();
	const { disconnect } = useDisconnect();
	const { signMessageAsync } = useSignMessage();
	const { open } = useWeb3Modal();

	useEffect(() => {
		domain._open = open;
	}, [open]);

	useEffect(() => {
		domain._disconnect = disconnect;
	}, [disconnect]);

	useEffect(() => {
		domain._signMessageAsync = signMessageAsync;
	}, [signMessageAsync]);

	useEffect(() => {
		console.log('address: ', address);
		domain._gotAddress(address);
	}, [address]);

	return children;
}
