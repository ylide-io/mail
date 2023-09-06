import { generatePath } from 'react-router-dom';

import { Community, getCommunityBannerImage } from '../../../stores/communities/communities';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/url';
import { CommunityAvatar } from '../../avatar/avatar';
import { CommunityBanner } from '../../communityBanner/communityBanner';
import css from './richCommunityCard.module.scss';

export interface RichCommunityCardProps {
	community: Community;
}

export function RichCommunityCard({ community }: RichCommunityCardProps) {
	const navigate = useNav();
	const href = generatePath(RoutePath.PROJECT_ID, { projectId: community.id });

	return (
		<a
			className={css.root}
			href={href}
			onClick={e => {
				e.preventDefault();
				navigate(href);
			}}
		>
			<CommunityBanner image={getCommunityBannerImage(community)} />

			<div className={css.info}>
				<CommunityAvatar className={css.ava} community={community} />

				<div className={css.name}>{community.name}</div>

				<div>{community.description || `${community.name} community`}</div>
			</div>
		</a>
	);
}
