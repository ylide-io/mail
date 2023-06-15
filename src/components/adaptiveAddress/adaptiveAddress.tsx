import { HTMLAttributes } from 'react';

import { AdaptiveText } from '../adaptiveText/adaptiveText';
import { PropsWithClassName } from '../props';

interface AdaptiveAddressProps extends PropsWithClassName, HTMLAttributes<HTMLDivElement> {
	address: string;
	maxLength?: number;
	textAlign?: 'left' | 'right';
	noTooltip?: boolean;
}

export function AdaptiveAddress({
	className,
	address,
	maxLength,
	textAlign = 'left',
	noTooltip,
	...props
}: AdaptiveAddressProps) {
	return (
		<AdaptiveText
			{...props}
			maxLength={maxLength}
			textAlign={textAlign}
			className={className}
			text={address}
			title={noTooltip ? undefined : address}
		/>
	);
}
