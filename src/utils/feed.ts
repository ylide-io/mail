import { LinkType } from '../stores/Feed';

export function formatFeedLinkType(linkType: LinkType) {
	return {
		[LinkType.TWITTER]: 'Twitter',
		[LinkType.MIRROR]: 'Mirror',
		[LinkType.DISCORD]: 'Discord',
		[LinkType.TELEGRAM]: 'Telegram',
		[LinkType.MEDIUM]: 'Medium',
	}[linkType];
}
