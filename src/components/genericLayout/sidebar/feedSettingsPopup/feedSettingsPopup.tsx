import clsx from 'clsx';
import { reaction } from 'mobx';
import React, { RefObject, useState } from 'react';

import { YlideButton } from '../../../../controls/YlideButton';
import { checkboxCheckIcon } from '../../../../icons/static/checkboxCheckIcon';
import feed, { FeedCategory, getFeedCategoryName, nonSyntheticFeedCategories } from '../../../../stores/Feed';
import { AnchoredPopup } from '../../../popup/anchoredPopup/anchoredPopup';
import css from './feedSettingsPopup.module.scss';

interface FeedSettingsPopupProps {
	anchorRef: RefObject<HTMLElement>;
	onClose: () => void;
}

export function FeedSettingsPopup({ anchorRef, onClose }: FeedSettingsPopupProps) {
	const [value, setValue] = useState(feed.mainCategories);

	reaction(
		() => feed.mainCategories,
		() => setValue(feed.mainCategories),
	);

	return (
		<AnchoredPopup
			anchorRef={anchorRef}
			className={css.root}
			alignerOptions={{ fitLeftToViewport: true, fitTopToViewport: true }}
			onCloseRequest={onClose}
		>
			<div className={css.title}>My feed settings</div>

			<div className={css.list}>
				{nonSyntheticFeedCategories.map(category => (
					<button
						key={category}
						className={css.row}
						onClick={() => {
							setValue(
								value.includes(category) ? value.filter(t => t !== category) : [...value, category],
							);
						}}
					>
						<div className={clsx(css.checkBox, value.includes(category) && css.checkBox_checked)}>
							{value.includes(category) && checkboxCheckIcon}
						</div>
						<div className={css.rowTitle}>{getFeedCategoryName(category)}</div>
					</button>
				))}
			</div>

			<div className={css.footer}>
				<YlideButton
					nice
					size="small"
					onClick={() => {
						feed.mainCategories = [...value];
						localStorage.setItem('t_main_categories', JSON.stringify(feed.mainCategories));
						if (feed.selectedCategory === FeedCategory.MAIN) {
							feed.loadCategory(FeedCategory.MAIN, null);
						}
						onClose();
					}}
				>
					Save changes
				</YlideButton>
				<YlideButton
					ghost
					size="small"
					onClick={() => {
						setValue(feed.mainCategories);
						onClose();
					}}
				>
					Cancel
				</YlideButton>
			</div>
		</AnchoredPopup>
	);
}
