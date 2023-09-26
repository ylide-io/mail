import { observer } from 'mobx-react';
import { RefObject } from 'react';

import { HorizontalAlignment } from '../../utils/alignment';
import { Emoji } from '../emoji/emoji';
import { AnchoredPopup } from '../popup/anchoredPopup/anchoredPopup';
import css from './reactionsPopup.module.scss';

export interface ReactionsPopupProps {
	anchorRef: RefObject<HTMLElement>;
	onSelect: (reaction: string) => void;
	onClose?: () => void;
}

export const ReactionsPopup = observer(({ anchorRef, onSelect, onClose }: ReactionsPopupProps) => {
	function renderGrid(reactions: string[]) {
		return reactions.map(reaction => (
			<div className={css.item} onClick={() => onSelect(reaction)}>
				<Emoji>{reaction}</Emoji>
			</div>
		));
	}

	return (
		<AnchoredPopup
			className={css.root}
			anchorRef={anchorRef}
			horizontalAlign={HorizontalAlignment.START}
			onCloseRequest={onClose}
		>
			<div className={css.inner}>
				<div className={css.grid}>{renderGrid(['👍', '👎', '🔥', '🚀', '🎉', '👀', '🙏', '❤️'])}</div>

				<div className={css.divider} />

				<div className={css.grid}>
					{renderGrid([
						'😁',
						'🤣',
						'😎',
						'🥰',
						'😊',
						'😢',
						'😐',
						'🤔',
						'😱',
						'🤯',
						'😡',
						'🤑',
						'😴',
						'🤮',
						'🤪',
						'🤡',
						'👏',
						'🤘',
						'💪',
						'👌',
						'🤞',
						'🤦',
						'🤷',
						'🙈',
						'💯',
						'🔝',
						'💥',
						'🍻',
						'🍿',
						'🦄',
						'🕊️',
						'💩',
					])}
				</div>
			</div>
		</AnchoredPopup>
	);
});
