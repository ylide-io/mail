export function openFilePicker(props?: { multiple?: boolean; accept?: string }): Promise<File[]> {
	return new Promise(resolve => {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = !!props?.multiple;
		input.accept = props?.accept || '';
		input.onchange = () => {
			resolve(Array.from(input.files || []));
		};
		input.click();
	});
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onloadend = () => {
			resolve(reader.result as ArrayBuffer);
		};

		reader.onerror = e => reject(e);

		reader.readAsArrayBuffer(file);
	});
}

export function readFileAsDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onloadend = () => {
			resolve(reader.result!.toString());
		};

		reader.onerror = e => reject(e);

		reader.readAsDataURL(file);
	});
}

export function formatFileSize(
	size: number,
	options: {
		precision?: number;
		binary?: boolean;
	} = {},
) {
	const precision = options.precision != null ? options.precision : 1;

	const thresh = options.binary ? 1024 : 1000;

	if (Math.abs(size) < thresh) {
		return size + ' B';
	}

	const units = options.binary
		? ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
		: ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	let u = -1;
	const r = 10 ** precision;

	do {
		size /= thresh;
		++u;
	} while (Math.round(Math.abs(size) * r) / r >= thresh && u < units.length - 1);

	return size.toFixed(precision) + ' ' + units[u];
}

export function downloadFile(data: Uint8Array, fileName: string) {
	const blob = new Blob([data], { type: 'octet/stream' });
	const url = window.URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.style.display = 'none';
	a.href = url;
	a.download = fileName;
	a.click();

	window.URL.revokeObjectURL(url);
}
