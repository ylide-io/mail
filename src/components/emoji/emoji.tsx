import { observer } from 'mobx-react';

import { PropsWithClassName } from '../props';
import css from './emoji.module.scss';

export interface EmojiProps extends PropsWithClassName {
	children: string;
}

export const Emoji = observer(({ className, children }: EmojiProps) => {
	return (
		<div className={className}>
			<div className={css.inner}>
				<svg className={css.svg} viewBox="0 0 20 20">
					<text x="10" y="10" textAnchor="middle" dominantBaseline="central">
						{children}
					</text>
				</svg>
			</div>
		</div>
	);
});
