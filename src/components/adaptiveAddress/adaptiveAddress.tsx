import { Tooltip } from 'antd';

import { AdaptiveText } from '../adaptiveText/adaptiveText';
import { PropsWithClassName } from '../propsWithClassName';

interface AdaptiveAddressProps extends PropsWithClassName {
	address: string;
	textAlign?: 'left' | 'right';
}

export function AdaptiveAddress({ className, address, textAlign = 'left' }: AdaptiveAddressProps) {
	return (
		<Tooltip
			title={<div style={{ fontFamily: 'monospace', textAlign: 'center', whiteSpace: 'nowrap' }}>{address}</div>}
		>
			<AdaptiveText textAlign={textAlign} className={className} text={address} />
		</Tooltip>
	);
}