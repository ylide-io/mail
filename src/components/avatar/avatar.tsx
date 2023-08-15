import clsx from 'clsx';
import { ReactNode } from 'react';

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

type ProjectAvatarProps = AvatarProps;

export function ProjectAvatar(props: ProjectAvatarProps) {
	return <Avatar {...props} innerClassName={clsx(css.inner_project, props.innerClassName)} />;
}
