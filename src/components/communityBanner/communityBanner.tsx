import clsx from 'clsx';

import { PropsWithClassName } from '../props';
import css from './communityBanner.module.scss';

export interface CommunityBannerProps extends PropsWithClassName {
	image: string;
}

export function CommunityBanner({ className, image }: CommunityBannerProps) {
	return (
		<div className={clsx(css.root, className)}>
			<div
				className={css.inner}
				style={{
					backgroundImage: `url("${image}")`,
				}}
			/>
		</div>
	);
}
