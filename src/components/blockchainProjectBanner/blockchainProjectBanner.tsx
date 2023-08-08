import clsx from 'clsx';

import { PropsWithClassName } from '../props';
import css from './blockchainProjectBanner.module.scss';

export interface BlockchainProjectBannerProps extends PropsWithClassName {
	image: string;
}

export function BlockchainProjectBanner({ className, image }: BlockchainProjectBannerProps) {
	return (
		<div
			className={clsx(css.root, className)}
			style={{
				backgroundImage: `url("${image}")`,
			}}
		/>
	);
}
