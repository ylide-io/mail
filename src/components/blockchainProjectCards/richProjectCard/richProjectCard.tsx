import { generatePath } from 'react-router-dom';

import {
	BlockchainProject,
	getBlockchainProjectBannerImage,
} from '../../../stores/blockchainProjects/blockchainProjects';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/url';
import { ProjectAvatar } from '../../avatar/avatar';
import { BlockchainProjectBanner } from '../../blockchainProjectBanner/blockchainProjectBanner';
import css from './richProjectCard.module.scss';

export interface RichProjectCardProps {
	project: BlockchainProject;
}

export function RichProjectCard({ project }: RichProjectCardProps) {
	const navigate = useNav();
	const href = generatePath(RoutePath.PROJECT_ID, { projectId: project.id });

	return (
		<a
			className={css.root}
			href={href}
			onClick={e => {
				e.preventDefault();
				navigate(href);
			}}
		>
			<BlockchainProjectBanner image={getBlockchainProjectBannerImage(project)} />

			<div className={css.info}>
				<ProjectAvatar className={css.ava} project={project} />

				<div className={css.name}>{project.name}</div>

				<div>{project.description}</div>
			</div>
		</a>
	);
}
