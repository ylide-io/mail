import { ReactNode } from 'react';

import { Blockie } from '../blockie/blockie';
import { PropsWithClassName } from '../props';
import css from './avatar.module.scss';

interface AvatarProps extends PropsWithClassName {
	image?: string;
	blockie?: string;
	placeholder?: ReactNode;
}

export function Avatar({ className, image, blockie, placeholder }: AvatarProps) {
	return (
		<div className={className}>
			<div className={css.inner}>
				<div className={css.inner2}>
					{image ? (
						<img className={css.content} src={image} />
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
