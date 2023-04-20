import Avatar from 'antd/lib/avatar/avatar';
import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import { useMutation, useQuery } from 'react-query';

import { FeedServerApi } from '../../../../api/feedServerApi';
import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { CheckBox } from '../../../../components/checkBox/checkBox';
import { ErrorMessage } from '../../../../components/errorMessage/errorMessage';
import { Modal } from '../../../../components/modal/modal';
import { OverlappingLoader } from '../../../../components/overlappingLoader/overlappingLoader';
import { Spinner } from '../../../../components/spinner/spinner';
import { TextField, TextFieldLook } from '../../../../components/textField/textField';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as ContactSvg } from '../../../../icons/ic20/contact.svg';
import { ReactComponent as SearchSvg } from '../../../../icons/ic28/search.svg';
import { browserStorage } from '../../../../stores/browserStorage';
import { toggleArrayItem } from '../../../../utils/array';
import { invariant } from '../../../../utils/assert';
import { formatFeedLinkType } from '../../../../utils/feed';
import { FeedLinkTypeIcon } from '../feedLinkTypeIcon/feedLinkTypeIcon';
import css from './feedSettingsPopup.module.scss';

interface RowProps {
	source: FeedServerApi.FeedSource;
	isSelected: boolean;
	onSelect: (sourceId: string, isSelected: boolean) => void;
}

export const Row = React.memo(({ source, isSelected, onSelect }: RowProps) => (
	<div key={source.id} className={clsx(css.row, css.row_data)}>
		<div className={css.checkBoxCell}>
			<CheckBox isChecked={isSelected} onChange={isChecked => onSelect(source.id, isChecked)} />
		</div>
		<div>
			<div className={css.sourceName}>
				<Avatar size={24} src={source.avatar} icon={<ContactSvg width="100%" height="100%" />} />

				<div className={css.sourceNameText}>{source.name}</div>
			</div>
		</div>
		<div>{source.origin}</div>
		<div>
			<a className={css.sourceLink} href={source.link} target="_blank" rel="noreferrer">
				<FeedLinkTypeIcon size={16} linkType={source.type} />
				{formatFeedLinkType(source.type)}
			</a>
		</div>
	</div>
));

//

export interface FeedSettingsPopupProps {
	onClose?: () => void;
}

export function FeedSettingsPopup({ onClose }: FeedSettingsPopupProps) {
	const { isLoading, data } = useQuery('feed-sources', async () => {
		const res = await FeedServerApi.getSources();
		res.sources.sort(
			(a, b) =>
				b.type.localeCompare(a.type) ||
				(a.origin || '').localeCompare(b.origin || '') ||
				a.name.localeCompare(b.name),
		);

		const allSourceIds = res.sources.map(s => s.id);
		setAllSourceIds(allSourceIds);

		setSelectedSourceIds(browserStorage.feedSourceSettings?.sourceIds || allSourceIds);

		return res;
	});

	const createSourceListMutation = useMutation((sourceIds: string[]) => FeedServerApi.createSourceList(sourceIds), {
		onSuccess: data => {
			invariant(selectedSourceIds);

			browserStorage.feedSourceSettings = {
				listId: data.sourceListId,
				sourceIds: selectedSourceIds,
			};

			onClose?.();
		},
		onError: () => toast("Couldn't save your feed settings. Please try again."),
	});

	const [allSourceIds, setAllSourceIds] = useState<string[]>([]);
	const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);

	const isSelectedAll = selectedSourceIds?.length === allSourceIds?.length;

	const [isSearchOpen, setSearchOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');

	const onRowSelect = useCallback((sourceId: string, isSelected: boolean) => {
		setSelectedSourceIds(prev => toggleArrayItem(prev, sourceId, isSelected));
	}, []);

	const saveChanges = () => {
		invariant(selectedSourceIds);

		if (isSelectedAll) {
			browserStorage.feedSourceSettings = undefined;
			onClose?.();
		} else {
			createSourceListMutation.mutate(selectedSourceIds);
		}
	};

	const filteredSources = data?.sources.filter(source => {
		const term = searchTerm.trim().toLowerCase();
		if (!term) return true;

		return source.name.toLowerCase().includes(term) || source.origin?.toLowerCase().includes(term);
	});

	return (
		<Modal className={css.root} onClose={onClose}>
			<div className={css.header}>
				<div className={css.title}>My Feed Settings</div>
				<div className={css.description}>Select sources you want to see in your Feed</div>
			</div>

			<div className={css.list}>
				{data ? (
					filteredSources?.length ? (
						<>
							<div className={clsx(css.row, css.row_header)}>
								<div className={css.checkBoxCell}>
									<CheckBox
										isChecked={isSelectedAll}
										onChange={isChecked => setSelectedSourceIds(isChecked ? allSourceIds : [])}
									/>
								</div>
								<div>Name</div>
								<div>Origin / Username</div>
								<div>Link</div>
							</div>

							{filteredSources.map(source => (
								<Row
									key={source.id}
									source={source}
									isSelected={selectedSourceIds.includes(source.id)}
									onSelect={onRowSelect}
								/>
							))}
						</>
					) : (
						<div className={css.noData}>- No sources found -</div>
					)
				) : isLoading ? (
					<OverlappingLoader text="Loading sources ..." />
				) : (
					<ErrorMessage className={css.error}>Couldn't load source list</ErrorMessage>
				)}
			</div>

			<div className={css.footer}>
				<div className={css.footerLeft}>
					<ActionButton
						isDisabled={!selectedSourceIds.length || createSourceListMutation.isLoading}
						look={ActionButtonLook.PRIMARY}
						onClick={() => saveChanges()}
					>
						Save Settings
					</ActionButton>

					<ActionButton isDisabled={createSourceListMutation.isLoading} onClick={() => onClose?.()}>
						Cancel
					</ActionButton>
				</div>

				<div className={css.footerRight}>
					{createSourceListMutation.isLoading ? (
						<Spinner />
					) : data ? (
						isSearchOpen ? (
							<TextField
								look={TextFieldLook.LITE}
								autoFocus
								placeholder="Search"
								value={searchTerm}
								onValueChange={setSearchTerm}
							/>
						) : (
							<ActionButton
								look={ActionButtonLook.LITE}
								icon={<SearchSvg />}
								title="Search"
								onClick={() => setSearchOpen(true)}
							/>
						)
					) : undefined}
				</div>
			</div>
		</Modal>
	);
}
