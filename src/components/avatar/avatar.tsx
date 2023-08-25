import clsx from 'clsx';
import { ReactNode } from 'react';

import { BlockchainProject } from '../../stores/blockchainProjects/blockchainProjects';
import { Blockie } from '../blockie/blockie';
import { PropsWithClassName } from '../props';
import css from './avatar.module.scss';

interface AvatarProps extends PropsWithClassName {
	innerClassName?: string;
	image?: string;
	blockie?: string;
	placeholder?: ReactNode;
}

export function Avatar({ className, innerClassName, image, blockie, placeholder }: AvatarProps) {
	return (
		<div className={className}>
			<div className={clsx(css.inner, innerClassName)}>
				<div className={css.inner2}>
					{image ? (
						<img className={clsx(css.content, css.content_image)} src={image} alt="Avatar" />
					) : blockie ? (
						<Blockie className={css.content} address={blockie} />
					) : (
						placeholder
					)}
				</div>
			</div>
		</div>
	);
}

//

interface ProjectAvatarProps extends PropsWithClassName {
	innerClassName?: string;
	project: BlockchainProject;
}

export function ProjectAvatar({ project, ...props }: ProjectAvatarProps) {
	return (
		<Avatar
			{...props}
			innerClassName={clsx(css.inner_project, props.innerClassName)}
			image={project.profileImage}
			blockie={project.id}
		/>
	);
}
