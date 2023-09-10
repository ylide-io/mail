import clsx from 'clsx';
import { observer } from 'mobx-react';
import { generatePath } from 'react-router-dom';

import { Community } from '../../../stores/communities/communities';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/url';
import { CommunityAvatar } from '../../avatar/avatar';
import { isSidebarOpen } from '../../genericLayout/sidebar/sidebarMenu';
import { PropsWithClassName } from '../../props';
import css from './miniCommunityCard.module.scss';

export interface MiniCommunityCardProps extends PropsWithClassName {
	community: Community;
}

export const MiniCommunityCard = observer(({ className, community }: MiniCommunityCardProps) => {
	const navigate = useNav();
	const href = generatePath(RoutePath.PROJECT_ID, { projectId: community.id });

	return (
		<a
			className={clsx(css.root, className)}
			href={href}
			onClick={e => {
				e.preventDefault();
				isSidebarOpen.set(false);
				navigate(href);
			}}
		>
			<CommunityAvatar className={css.logo} community={community} />

			<div className={css.name}>{community.name}</div>
		</a>
	);
});
