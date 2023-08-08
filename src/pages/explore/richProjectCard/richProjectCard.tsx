import { generatePath } from 'react-router-dom';

import { ProjectAvatar } from '../../../components/avatar/avatar';
import { BlockchainProjectBanner } from '../../../components/blockchainProjectBanner/blockchainProjectBanner';
import { BlockchainProject } from '../../../stores/blockchainProjects/blockchainProjects';
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
			<BlockchainProjectBanner
				image={project.banner || 'https://cdn.pixabay.com/photo/2016/09/29/13/08/planet-1702788_1280.jpg'}
			/>

			<div className={css.info}>
				<ProjectAvatar
					className={css.ava}
					image={project.profilePicture || 'https://picsum.photos/id/1067/200'}
				/>

				<div className={css.name}>{project.name}</div>

				<div>{project.description}</div>
			</div>
		</a>
	);
}
