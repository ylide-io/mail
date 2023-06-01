import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'react-query';

import { FeedManagerApi } from '../../../../api/feedManagerApi';
import { FeedServerApi, FeedSource } from '../../../../api/feedServerApi';
import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { Avatar } from '../../../../components/avatar/avatar';
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
import { DomainAccount } from '../../../../stores/models/DomainAccount';
import { toggleArrayItem } from '../../../../utils/array';
import { invariant } from '../../../../utils/assert';
import { FeedLinkTypeIcon } from '../feedLinkTypeIcon/feedLinkTypeIcon';
import css from './feedSettingsPopup.module.scss';

interface RowProps {
	source: FeedSource;
	isSelected: boolean;
	onSelect: (sourceId: string, isSelected: boolean) => void;
}

export const Row = React.memo(({ source, isSelected, onSelect }: RowProps) => (
	<div key={source.id} className={clsx(css.row, css.row_data)}>
		<div className={css.checkBoxCell}>
			<CheckBox isChecked={isSelected} onChange={isChecked => onSelect(source.id, isChecked)} />
		</div>

		<div className={clsx(css.nameCell, css.sourceName)}>
			<Avatar image={source.avatar} placeholder={<ContactSvg width="100%" height="100%" />} />

			<div className={css.sourceNameText}>{source.name}</div>
		</div>

		<div className={clsx(css.originCell, css.sourceOrigin)}>
			<a className={css.sourceOriginLink} href={source.link} target="_blank" rel="noreferrer">
				<FeedLinkTypeIcon size={16} linkType={source.type} />
				<span className={css.sourceOriginText}>{source.origin || source.link}</span>
			</a>
		</div>

		<div className={clsx(css.projectCell, css.sourceProject)}>{source.cryptoProjectName}</div>
	</div>
));

//

export interface FeedSettingsPopupProps {
	account: DomainAccount;
	onClose?: () => void;
}

export const FeedSettingsPopup = observer(({ account, onClose }: FeedSettingsPopupProps) => {
	const { isLoading, data } = useQuery('feed-sources', async () => {
		const mainViewKey = account.mainViewKey;
		invariant(mainViewKey, 'FeedSettings only supports MV accounts');

		const [sources, config] = await Promise.all([
			FeedServerApi.getSources(),
			FeedManagerApi.getConfig({ token: mainViewKey }),
		]);

		sources.sources.sort(
			(a, b) =>
				b.type.localeCompare(a.type) ||
				(a.origin || '').localeCompare(b.origin || '') ||
				a.name.localeCompare(b.name),
		);

		const allSourceIds = sources.sources.map(s => s.id);
		setAllSourceIds(allSourceIds);

		setSelectedSourceIds(browserStorage.feedSourceSettings?.sourceIds || allSourceIds);

		return {
			sources: sources.sources,
			config,
		};
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

	const filteredSources = useMemo(
		() =>
			data?.sources.filter(source => {
				const term = searchTerm.trim().toLowerCase();
				if (!term) return true;

				return source.name.toLowerCase().includes(term) || source.origin?.toLowerCase().includes(term);
			}),
		[data, searchTerm],
	);

	return (
		<Modal className={css.root} onClose={onClose}>
			<div className={css.header}>
				<div className={css.title}>My Feed Settings</div>
				<div className={css.description}>Select sources you want to see in your Feed</div>
			</div>

			<div className={css.list}>
				{filteredSources ? (
					filteredSources.length ? (
						<>
							<div className={clsx(css.row, css.row_header)}>
								<div className={css.checkBoxCell}>
									<CheckBox
										isChecked={isSelectedAll}
										onChange={isChecked => setSelectedSourceIds(isChecked ? allSourceIds : [])}
									/>
								</div>
								<div className={css.nameCell}>Name</div>
								<div className={css.originCell}>Origin</div>
								<div className={css.projectCell}>Project</div>
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
});
