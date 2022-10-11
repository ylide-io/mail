import React, { PropsWithChildren, useState } from 'react';

const ClickToCopy: React.FC<PropsWithChildren<{ dataToCopy: string }>> = ({ children, dataToCopy }) => {
	const [status, setStatus] = useState<'None' | 'Copied' | 'Hover'>('None');

	const copyHandler = async (data: string) => {
		try {
			await navigator.clipboard.writeText(data);
			setStatus('Copied');
			setTimeout(() => {
				setStatus('None');
			}, 1500);
		} catch (e) {
			console.log('Error copying');
		}
	};

	return (
		<span
			style={{
				position: 'relative',
				wordBreak: 'break-word',
				backgroundColor: 'rgba(136,136,136,0.26)',
				fontWeight: 'bold',
				cursor: 'pointer',
			}}
			onMouseEnter={() => {
				if (status !== 'Copied') {
					setStatus('Hover');
				}
			}}
			onMouseLeave={() => {
				if (status !== 'Copied') {
					setStatus('None');
				}
			}}
			onClick={() => copyHandler(dataToCopy)}
		>
			{children}
			{status === 'Copied' && (
				<div
					style={{
						position: 'absolute',
						top: 30,
						right: 0,
						padding: 3,
						borderRadius: '5px',
						backgroundColor: '#18a689',
						color: '#ffffff',
					}}
				>
					Copied
				</div>
			)}
			{status === 'Hover' && (
				<div
					style={{
						position: 'absolute',
						top: 30,
						right: 0,
						padding: 3,
						borderRadius: '5px',
						backgroundColor: '#18a689',
						color: '#ffffff',
					}}
				>
					Click to copy
				</div>
			)}
		</span>
	);
};

export default ClickToCopy;
