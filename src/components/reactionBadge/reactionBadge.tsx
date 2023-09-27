import clsx from 'clsx';
import { observer } from 'mobx-react';
import { forwardRef, Ref } from 'react';

import { formatCounter } from '../../utils/number';
import { Emoji } from '../emoji/emoji';
import { PropsWithClassName } from '../props';
import css from './reactionBadge.module.scss';

export interface ReactionBadgeProps extends PropsWithClassName {
	reaction: string;
	counter?: number;
	isActive?: boolean;
	onClick?: () => void;
}

export const ReactionBadge = observer(
	forwardRef(({ className, reaction, counter, isActive, onClick }: ReactionBadgeProps, ref: Ref<HTMLDivElement>) => {
		return (
			<div
				ref={ref}
				className={clsx(
					css.root,
					onClick && css.root_clickable,
					isActive && css.root_active,
					!!counter && css.root_hasCounter,
					className,
				)}
				onClick={onClick}
			>
				<Emoji className={css.emoji}>{reaction}</Emoji>

				{!!counter && <div className={css.counter}>{formatCounter(counter)}</div>}
			</div>
		);
	}),
);
