import { generatePath } from 'react-router-dom';

import { ProjectAvatar } from '../../../components/avatar/avatar';
import { BlockchainProjectBanner } from '../../../components/blockchainProjectBanner/blockchainProjectBanner';
import {
	BlockchainProject,
	getBlockchainProjectBannerImage,
} from '../../../stores/blockchainProjects/blockchainProjects';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/url';
import css from './richProjectCard.module.scss';

export interface RichProjectCardProps {
	project: BlockchainProject;
}

export function RichProjectCard({ project }: RichProjectCardProps) {
	const navigate = useNav();
	const href = generatePath(RoutePath.PROJECT, { projectId: project.id });

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
				<ProjectAvatar
					className={css.ava}
					image={project.profileImage || 'https://picsum.photos/id/1067/200'}
				/>

				<div className={css.name}>{project.name}</div>

				<div>{project.description}</div>
			</div>
		</a>
	);
}
