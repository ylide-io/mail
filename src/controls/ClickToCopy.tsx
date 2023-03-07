import { Tooltip } from 'antd';
import React, { PropsWithChildren, useState } from 'react';

import { copyToClipboard } from '../utils/clipboard';

const ClickToCopy: React.FC<PropsWithChildren<{ dataToCopy: string }>> = ({ children, dataToCopy }) => {
	const [status, setStatus] = useState<'None' | 'Copied' | 'Hover'>('None');

	const copyHandler = async (data: string) => {
		try {
			await copyToClipboard(data);
			setStatus('Copied');
			setTimeout(() => {
				setStatus('None');
			}, 1500);
		} catch (e) {
			console.log('Error copying');
		}
	};

	return (
		<Tooltip title={status === 'Copied' ? 'Copied' : 'Click to copy'}>
			<span
				style={{
					position: 'relative',
					wordBreak: 'break-word',
					backgroundColor: 'rgba(136,136,136,0.26)',
					fontWeight: 'bold',
					cursor: 'pointer',
				}}
				onClick={() => copyHandler(dataToCopy)}
			>
				{children}
			</span>
		</Tooltip>
	);
};

export default ClickToCopy;
