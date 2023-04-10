import { Tooltip } from 'antd';

import { formatAddress } from '../../utils/blockchain';
import { AdaptiveText } from '../adaptiveText/adaptiveText';
import { PropsWithClassName } from '../propsWithClassName';

interface AdaptiveAddressProps extends PropsWithClassName {
	address: string;
	textAlign?: 'left' | 'right';
}

export function AdaptiveAddress({ className, address, textAlign = 'left' }: AdaptiveAddressProps) {
	const cleanAddress = formatAddress(address);

	return (
		<Tooltip
			title={
				<div style={{ fontFamily: 'monospace', textAlign: 'center', whiteSpace: 'nowrap' }}>{cleanAddress}</div>
			}
		>
			<AdaptiveText textAlign={textAlign} className={className} text={cleanAddress} />
		</Tooltip>
	);
}
