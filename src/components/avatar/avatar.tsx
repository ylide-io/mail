import { ReactNode, useState } from 'react';

import { Blockie } from '../blockie/blockie';
import { PropsWithClassName } from '../props';
import css from './avatar.module.scss';

interface AvatarProps extends PropsWithClassName {
	image?: string;
	blockie?: string;
	placeholder?: ReactNode;
}

export function Avatar({ className, image, blockie, placeholder }: AvatarProps) {
	const [imageLoadFailed, setImageLoadFailed] = useState(false);
	return (
		<div className={className}>
			<div className={css.inner}>
				<div className={css.inner2}>
					{image && !imageLoadFailed ? (
						<img className={css.content} src={image} onError={() => setImageLoadFailed(true)} />
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
