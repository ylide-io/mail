import { Tooltip } from 'antd';

import { PropsWithClassName } from '../../components/propsWithClassName';
import { AdaptiveText } from '../adaptiveText/adaptiveText';

interface AdaptiveAddressProps extends PropsWithClassName {
	address: string;
}

export function AdaptiveAddress({ className, address }: AdaptiveAddressProps) {
	return (
		<Tooltip
			title={<div style={{ fontFamily: 'monospace', textAlign: 'center', whiteSpace: 'nowrap' }}>{address}</div>}
		>
			<AdaptiveText className={className} text={address} />
		</Tooltip>
	);
}
