const YLIDE_IPFS_NODE = 'https://ipfs.ylide.io';

export const uploadToIpfs = async (data: Uint8Array) => {
	const formData = new FormData();

	formData.append('file', new Blob([data]));

	const response = await fetch(YLIDE_IPFS_NODE, {
		method: 'POST',
		body: formData,
	});

	const json = await response.json();

	return {
		hash: json.Hash as string,
		size: parseInt(json.Size, 10),
	};
};

export const downloadFromIpfsAsArray = async (hash: string) => {
	const response = await fetch(`${YLIDE_IPFS_NODE}/file/${hash}`);

	const data = await response.arrayBuffer();

	return new Uint8Array(data);
};

export const downloadFromIpfsAsBlob = async (hash: string) => {
	const response = await fetch(`${YLIDE_IPFS_NODE}/file/${hash}`);

	const data = await response.blob();

	return data;
};

// maybe replace with npm lib: https://www.npmjs.com/package/downloadjs ?
export const downloadBlob = (file: File) => {
	const data = window.URL.createObjectURL(file);
	const link = document.createElement('a');
	link.href = data;
	link.download = file.name;
	link.dispatchEvent(
		new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			view: window,
		}),
	);
	window.URL.revokeObjectURL(data);
	link.remove();
};
