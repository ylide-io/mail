import { LinkType } from '../../stores/Feed';
import { PropsWithClassName } from '../propsWithClassName';
import { ReactComponent as DiscordSvg } from './icons/discord.svg';
import { ReactComponent as MediumSvg } from './icons/medium.svg';
import { ReactComponent as MirrorSvg } from './icons/mirror.svg';
import { ReactComponent as TelegramSvg } from './icons/telegram.svg';
import { ReactComponent as TwitterSvg } from './icons/twitter.svg';

interface FeedLinkTypeIconProps extends PropsWithClassName {
	linkType: LinkType;
	size?: number | string;
}

export function FeedLinkTypeIcon({ className, linkType, size }: FeedLinkTypeIconProps) {
	const Icon = {
		[LinkType.TWITTER]: TwitterSvg,
		[LinkType.MIRROR]: MirrorSvg,
		[LinkType.DISCORD]: DiscordSvg,
		[LinkType.TELEGRAM]: TelegramSvg,
		[LinkType.MEDIUM]: MediumSvg,
	}[linkType];

	return <Icon width={size} height={size} className={className} />;
}
