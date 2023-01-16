import { Tooltip } from 'antd';
import clsx from 'clsx';

import { PropsWithClassName } from '../../components/propsWithClassName';
import { AdaptiveText } from '../adaptiveText/adaptiveText';
import css from './adaptiveAddress.module.scss';

interface AdaptiveAddressProps extends PropsWithClassName {
	address: string;
}

export function AdaptiveAddress({ className, address }: AdaptiveAddressProps) {
	return (
		<Tooltip
			title={<div style={{ fontFamily: 'monospace', textAlign: 'center', whiteSpace: 'nowrap' }}>{address}</div>}
		>
			<AdaptiveText className={clsx(css.root, className)} text={address} />
		</Tooltip>
	);
}
