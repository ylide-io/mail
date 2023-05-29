export function getIpfsHashFromUrl(url: string) {
	return url.replace('ipfs://', '');
}

export function ipfsToHttpUrl(url: string) {
	return `https://ipfs.ylide.io/file/${getIpfsHashFromUrl(url)}`;
}
