import { Tooltip } from 'antd';

import { PropsWithClassName } from '../../components/propsWithClassName';
import { AdaptiveText } from '../adaptiveText/adaptiveText';

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
