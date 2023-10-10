import React from 'react';

export const CSVInput = ({ addItems }: { addItems: (v: string[]) => void }) => {
	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target?.files?.[0]) {
			const reader = new FileReader();

			reader.onload = (e: ProgressEvent<FileReader>) => {
				if (!e.target?.result || typeof e.target.result !== 'string') return;
				const addresses = (e.target.result.split('\n') as string[]).map(l => l.trim().toLowerCase());
				addItems(addresses);
			};

			reader.readAsText(event.target.files[0]);
		}
	};

	return (
		<div style={{ padding: '8px' }}>
			<label htmlFor="fileInput">Upload CSV</label>
			<input
				id="fileInput"
				style={{ display: 'none' }}
				type="file"
				accept=".csv"
				title="upload csv"
				value={''}
				onChange={handleFileUpload}
			/>
		</div>
	);
};
