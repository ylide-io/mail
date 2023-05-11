import { AdaptiveText } from '../adaptiveText/adaptiveText';
import { PropsWithClassName } from '../props';

interface AdaptiveAddressProps extends PropsWithClassName {
	address: string;
	textAlign?: 'left' | 'right';
	noTooltip?: boolean;
}

export function AdaptiveAddress({ className, address, textAlign = 'left', noTooltip }: AdaptiveAddressProps) {
	return (
		<AdaptiveText
			textAlign={textAlign}
			className={className}
			text={address}
			title={noTooltip ? undefined : address}
		/>
	);
}
