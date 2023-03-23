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
