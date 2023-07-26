import { randomArrayElem } from './array';

export function hashToIpfsUrl(hash: string) {
	return `ipfs://${hash}`;
}

export function getIpfsHashFromUrl(url: string) {
	return url.replace('ipfs://', '');
}

export function ipfsToHttpUrl(url: string) {
	const ipfsUrls = ['https://ipfs1.ylide.io', 'https://ipfs2.ylide.io', 'https://ipfs3.ylide.io'];
	return `${randomArrayElem(ipfsUrls)}/file/${getIpfsHashFromUrl(url)}`;
}
