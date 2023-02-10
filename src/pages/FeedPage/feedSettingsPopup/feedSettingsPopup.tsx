import { Fragment, useLayoutEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'react-query';

import { FeedServerApi } from '../../../api/feedServerApi';
import { ActionButton, ActionButtonStyle } from '../../../components/ActionButton/ActionButton';
import { CheckBox } from '../../../components/checkBox/checkBox';
import { ErrorMessage } from '../../../components/errorMessage/errorMessage';
import { Modal } from '../../../components/modal/modal';
import { OverlappingLoader } from '../../../components/overlappingLoader/overlappingLoader';
import { Spinner } from '../../../components/spinner/spinner';
import { ReactComponent as ExternalSvg } from '../../../icons/external.svg';
import { ReactComponent as SelectAllSvg } from '../../../icons/selectAll.svg';
import { browserStorage } from '../../../stores/browserStorage';
import { FeedCategory, FeedSource, getFeedCategoryName, nonSyntheticFeedCategories } from '../../../stores/Feed';
import { toggleArrayItem } from '../../../utils/array';
import { invariant } from '../../../utils/invariant';
import css from './feedSettingsPopup.module.scss';

interface SourceItemProps {
	name: string;
	link?: string;
	isChecked?: boolean;
	onChange?: (isChecked: boolean) => void;
}

export function SourceItem({ name, link, isChecked, onChange }: SourceItemProps) {
	return (
		<label className={css.item}>
			<CheckBox isChecked={isChecked} onChange={onChange} />

			<div className={css.itemText}>{name}</div>

			{link && (
				<a className={css.itemLink} href={link} target="_blank" rel="noreferrer">
					<ExternalSvg />
				</a>
			)}
		</label>
	);
}

export interface FeedSettingsPopupProps {
	onClose?: () => void;
}

export function FeedSettingsPopup({ onClose }: FeedSettingsPopupProps) {
	const { isLoading, data } = useQuery('feed-sources', FeedServerApi.getSources);

	const createSourceListMutation = useMutation((sourceIds: string[]) => FeedServerApi.createSourceList(sourceIds), {
		onSuccess: data => {
			invariant(selectedSourceIds);

			browserStorage.feedSourceSettings = {
				listId: data.sourceListId,
				sourceIds: selectedSourceIds,
			};

			onClose?.();
		},
		onError: () => alert("Couldn't save your feed settings. Please try again."),
	});

	const list = useMemo<Record<FeedCategory, FeedSource[]> | undefined>(() => {
		const categoryToSourceList = data?.sources.reduce((prev, curr) => {
			if (nonSyntheticFeedCategories.includes(curr.category)) {
				prev[curr.category] = prev[curr.category] || [];
				prev[curr.category].push(curr);
			}

			return prev;
		}, {} as Record<FeedCategory, FeedSource[]>);

		if (categoryToSourceList) {
			Object.values(categoryToSourceList).map(list =>
				list.sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : a.id.localeCompare(b.id))),
			);
		}

		return categoryToSourceList;
	}, [data?.sources]);

	const [selectedSourceIds, setSelectedSourceIds] = useState(browserStorage.feedSourceSettings?.sourceIds);

	const allSourceIds = useMemo(
		() => list && Object.values(list).reduce((prev, curr) => prev.concat(curr.map(s => s.id)), [] as string[]),
		[list],
	);

	const isSelectedAll = selectedSourceIds?.length === allSourceIds?.length;

	// Populate selected-source-ids
	useLayoutEffect(() => {
		if (selectedSourceIds == null && allSourceIds) {
			setSelectedSourceIds(allSourceIds);
		}
	}, [allSourceIds, selectedSourceIds]);

	const saveChanges = () => {
		invariant(selectedSourceIds);

		if (isSelectedAll) {
			browserStorage.feedSourceSettings = undefined;
			onClose?.();
		} else {
			createSourceListMutation.mutate(selectedSourceIds);
		}
	};

	return (
		<Modal className={css.root} onClose={onClose}>
			<div className={css.title}>My Feed Settings</div>
			<div className={css.description}>Select sources you want to see in your Feed</div>

			<div className={css.list}>
				{list ? (
					nonSyntheticFeedCategories.map(category => {
						const sources = list[category];
						const sourceIds = sources.map(s => s.id);
						const isAllSelectedInCategory = sourceIds.every(id => selectedSourceIds?.includes(id));

						return (
							<Fragment key={category}>
								<SourceItem
									name={getFeedCategoryName(category)}
									isChecked={isAllSelectedInCategory}
									onChange={isChecked => {
										const categoryUnselected =
											selectedSourceIds?.filter(id => !sourceIds.includes(id)) || [];

										setSelectedSourceIds(
											isChecked ? categoryUnselected.concat(sourceIds) : categoryUnselected,
										);
									}}
								/>

								<div className={css.subList}>
									{sources.map(source => (
										<SourceItem
											key={source.id}
											name={source.name}
											link={source.link}
											isChecked={selectedSourceIds?.includes(source.id) || false}
											onChange={isChecked =>
												setSelectedSourceIds(
													toggleArrayItem(selectedSourceIds || [], source.id, isChecked),
												)
											}
										/>
									))}
								</div>
							</Fragment>
						);
					})
				) : isLoading ? (
					<OverlappingLoader text="Loading sources ..." />
				) : (
					<ErrorMessage className={css.error}>Couldn't load source list</ErrorMessage>
				)}
			</div>

			<div className={css.footer}>
				<ActionButton
					isDisabled={!selectedSourceIds?.length || createSourceListMutation.isLoading}
					style={ActionButtonStyle.Primary}
					onClick={() => saveChanges()}
				>
					Save Settings
				</ActionButton>

				<ActionButton isDisabled={createSourceListMutation.isLoading} onClick={() => onClose?.()}>
					Cancel
				</ActionButton>

				{createSourceListMutation.isLoading ? (
					<Spinner className={css.footerRight} />
				) : (
					list && (
						<ActionButton
							className={css.footerRight}
							style={ActionButtonStyle.Lite}
							icon={<SelectAllSvg />}
							title="Select All"
							onClick={() => setSelectedSourceIds(isSelectedAll ? [] : allSourceIds)}
						/>
					)
				)}
			</div>
		</Modal>
	);
}
