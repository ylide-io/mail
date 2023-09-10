import clsx from 'clsx';

import _defaultBannerSrc from '../../stores/communities/bannerImages/_default.png';
import { Community } from '../../stores/communities/communities';
import { PropsWithClassName } from '../props';
import css from './communityBanner.module.scss';

export interface CommunityBannerProps extends PropsWithClassName {
	community: Community;
}

export function CommunityBanner({ className, community }: CommunityBannerProps) {
	return (
		<div className={clsx(css.root, className)}>
			<div
				className={css.inner}
				style={{
					backgroundImage: `url("${community.bannerImage || _defaultBannerSrc}")`,
				}}
			/>
		</div>
	);
}
