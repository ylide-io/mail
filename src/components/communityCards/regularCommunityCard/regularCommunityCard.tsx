import { generatePath } from 'react-router-dom';

import { Community } from '../../../stores/communities/communities';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/url';
import { CommunityAvatar } from '../../avatar/avatar';
import css from './regularCommunityCard.module.scss';

export interface RegularCommunityCardProps {
	community: Community;
}

export function RegularCommunityCard({ community }: RegularCommunityCardProps) {
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
			<CommunityAvatar className={css.ava} community={community} />

			<div className={css.name}>{community.name}</div>

			<div className={css.description}>{community.description || `${community.name} community`}</div>
		</a>
	);
}
