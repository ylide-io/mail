import clsx from 'clsx';
import { ReactNode } from 'react';

import { PropsWithClassName, PropsWithCSSStyle } from '../props';
import css from './ylideLoader.module.scss';

interface YlideLoaderProps extends PropsWithClassName, PropsWithCSSStyle {
	reason?: ReactNode;
}

export function YlideLoader({ className, style, reason }: YlideLoaderProps) {
	return (
		<div className={clsx(css.root, className)} style={style}>
			<div className={css.loader}>
				<svg
					width="48"
					height="58"
					viewBox="0 0 267 321"
					fill="currentColor"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M119.014 33.769L86.5931 1.32588V0.719727C83.7901 5.95392 79.4719 10.255 74.2246 13.0368H74.8841L107.295 45.4697V45.5606C110.007 40.609 114.081 36.5103 119.014 33.769Z" />
					<path d="M180.613 1.32588V1.13221C183.42 6.17989 187.648 10.3285 192.757 13.0368H192.322L159.911 45.4697V45.9795C157.22 40.8741 153.093 36.6433 148.067 33.825H148.136L180.613 1.32588Z" />
					<path d="M125.331 88.5928V176.886C127.924 176.15 130.661 175.756 133.491 175.756C136.408 175.756 139.227 176.175 141.892 176.955V88.5232C139.227 89.3035 136.408 89.722 133.491 89.722C130.661 89.722 127.924 89.3283 125.331 88.5928Z" />
					<path d="M118.327 179.89L86.4937 148.052V147.839C83.7255 152.922 79.5227 157.111 74.4291 159.863H74.8841L106.945 191.946C109.529 186.935 113.489 182.749 118.327 179.89Z" />
					<path d="M33.8941 118.866V119.594C36.6771 114.36 40.9731 110.052 46.1989 107.254H45.686L13.1771 74.7238C10.3107 79.7123 6.04429 83.7942 0.914062 86.4332H1.46649L33.8941 118.866Z" />
					<path d="M125.331 234.32V321H141.892V234.25C139.227 235.03 136.408 235.449 133.491 235.449C130.661 235.449 127.924 235.055 125.331 234.32Z" />
					<path d="M160.107 192.084L192.389 159.796H192.43C187.486 157.096 183.39 153.037 180.643 148.122L148.796 179.974C153.613 182.857 157.55 187.06 160.107 192.084Z" />
					<path d="M233.279 118.899V119.962C230.482 114.519 226.062 110.048 220.658 107.188H221.57L253.887 74.8664C256.752 79.7902 260.986 83.8194 266.067 86.4332H265.74L233.279 118.899Z" />
				</svg>

				<div className={css.dots}>{(() => [...new Array(9)].map((_, i) => <div key={i} />))()}</div>
			</div>

			{reason != null && <div className={css.reason}>{reason}</div>}
		</div>
	);
}
