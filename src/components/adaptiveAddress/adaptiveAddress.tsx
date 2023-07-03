import { HTMLAttributes } from 'react';

import { AdaptiveText } from '../adaptiveText/adaptiveText';
import { PropsWithClassName } from '../props';

interface AdaptiveAddressProps extends PropsWithClassName, HTMLAttributes<HTMLDivElement> {
	contentClassName?: string;
	address: string;
	maxLength?: number;
	textAlign?: 'left' | 'right';
	noTooltip?: boolean;
}

export function AdaptiveAddress({
	className,
	contentClassName,
	address,
	maxLength,
	textAlign = 'left',
	noTooltip,
	...props
}: AdaptiveAddressProps) {
	return (
		<AdaptiveText
			{...props}
			className={className}
			contentClassName={contentClassName}
			maxLength={maxLength}
			textAlign={textAlign}
			text={address}
			title={noTooltip ? undefined : address}
		/>
	);
}
