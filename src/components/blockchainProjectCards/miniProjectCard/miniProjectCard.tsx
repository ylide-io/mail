import clsx from 'clsx';
import { observer } from 'mobx-react';
import { generatePath } from 'react-router-dom';

import { BlockchainProject } from '../../../stores/blockchainProjects/blockchainProjects';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/url';
import { ProjectAvatar } from '../../avatar/avatar';
import { isSidebarOpen } from '../../genericLayout/sidebar/sidebarMenu';
import { PropsWithClassName } from '../../props';
import css from './miniProjectCard.module.scss';

export interface MiniProjectCardProps extends PropsWithClassName {
	project: BlockchainProject;
}

export const MiniProjectCard = observer(({ className, project }: MiniProjectCardProps) => {
	const navigate = useNav();
	const href = generatePath(RoutePath.PROJECT, { projectId: project.id });

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
			<ProjectAvatar className={css.logo} image={project.profileImage} blockie={project.name} />

			<div className={css.name}>{project.name}</div>
		</a>
	);
});
