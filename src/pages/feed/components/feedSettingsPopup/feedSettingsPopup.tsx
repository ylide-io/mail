import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'react-query';

import { FeedManagerApi } from '../../../../api/feedManagerApi';
import { FeedReason, FeedServerApi, FeedSource } from '../../../../api/feedServerApi';
import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { Avatar } from '../../../../components/avatar/avatar';
import { CheckBox } from '../../../../components/checkBox/checkBox';
import { ErrorMessage } from '../../../../components/errorMessage/errorMessage';
import { Modal } from '../../../../components/modal/modal';
import { OverlappingLoader } from '../../../../components/overlappingLoader/overlappingLoader';
import { TextField, TextFieldLook } from '../../../../components/textField/textField';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as ContactSvg } from '../../../../icons/ic20/contact.svg';
import { ReactComponent as SearchSvg } from '../../../../icons/ic28/search.svg';
import { DomainAccount } from '../../../../stores/models/DomainAccount';
import { toggleArrayItem } from '../../../../utils/array';
import { invariant } from '../../../../utils/assert';
import { getSelectedSourceIds, updateFeedConfig } from '../../../../utils/feed';
import { FeedLinkTypeIcon } from '../feedLinkTypeIcon/feedLinkTypeIcon';
import css from './feedSettingsPopup.module.scss';

interface RowProps {
	source: FeedSource;
	isSelected: boolean;
	onSelect: (isSelected: boolean) => void;
}

export const Row = React.memo(({ source, isSelected, onSelect }: RowProps) => (
	<div key={source.id} className={clsx(css.row, css.row_data)}>
		<CheckBox className={css.sourceCheckBox} isChecked={isSelected} onChange={isChecked => onSelect(isChecked)} />

		<div className={css.sourceName}>
			<Avatar image={source.avatar} placeholder={<ContactSvg width="100%" height="100%" />} />

			<div className={css.sourceNameText}>{source.name}</div>
		</div>

		<div className={css.sourceOrigin}>
			<a className={css.sourceOriginLink} href={source.link} target="_blank" rel="noreferrer">
				<FeedLinkTypeIcon size={16} linkType={source.type} />
				<span className={css.sourceOriginText}>{source.origin || source.link}</span>
			</a>
		</div>

		<div className={css.sourceProject}>{source.cryptoProject?.name}</div>
	</div>
));

//

export interface FeedSettingsPopupProps {
	account: DomainAccount;
	onClose?: () => void;
}

export const FeedSettingsPopup = observer(({ account, onClose }: FeedSettingsPopupProps) => {
	invariant(account.mainViewKey, 'FeedSettings only supports MV accounts');

	const { isLoading, data } = useQuery('feed-sources', async () => {
		const mainViewKey = account.mainViewKey;

		const [{ sources }, config] = await Promise.all([
			FeedServerApi.getSources(),
			FeedManagerApi.getConfig({ token: mainViewKey }),
		]);

		sources.sort(
			(a, b) =>
				b.type.localeCompare(a.type) ||
				(a.origin || '').localeCompare(b.origin || '') ||
				a.name.localeCompare(b.name),
		);

		setSelectedSourceIds(getSelectedSourceIds(sources, config));

		return {
			sources,
			config,
		};
	});

	const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);

	const [isSearchOpen, setSearchOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');

	const sourcesByReason = useMemo(() => {
		const filteredSources = data?.sources.filter(source => {
			const term = searchTerm.trim().toLowerCase();
			if (!term) return true;

			return source.name.toLowerCase().includes(term) || source.origin?.toLowerCase().includes(term);
		});

		const grouped = filteredSources?.reduce((res, s) => {
			const reason = s.cryptoProjectReasons[0] || FeedReason.NONE;
			const list = (res[reason] = res[reason] || []);
			list.push(s);
			return res;
		}, {} as Record<FeedReason, FeedSource[]>);

		return (
			grouped &&
			(Object.keys(grouped) as FeedReason[])
				.sort((a: FeedReason, b: FeedReason) => {
					const getOrder = (reason: FeedReason) =>
						({
							[FeedReason.BALANCE]: 1,
							[FeedReason.PROTOCOL]: 2,
							[FeedReason.TRANSACTION]: 3,
							[FeedReason.NONE]: 4,
						}[reason]);

					return getOrder(a) - getOrder(b);
				})
				.reduce(
					(res, reason) => ({ ...res, [reason]: grouped[reason] }),
					{} as Record<FeedReason, FeedSource[]>,
				)
		);
	}, [data, searchTerm]);

	const saveConfigMutation = useMutation({
		mutationFn: async () => {
			invariant(data);
			await updateFeedConfig(account.mainViewKey, selectedSourceIds, data.sources, data.config);
		},
		onSuccess: () => onClose?.(),
		onError: () => toast("Couldn't save your feed settings. Please try again."),
	});

	return (
		<Modal className={css.root} onClose={onClose}>
			<div className={css.header}>
				<div className={css.title}>My Feed Settings</div>
				<div className={css.description}>Select sources you want to see in your Feed</div>
			</div>

			<div className={css.list}>
				{sourcesByReason ? (
					Object.keys(sourcesByReason).length ? (
						(Object.entries(sourcesByReason) as [FeedReason, FeedSource[]][]).map(([reason, sources]) => (
							<div className={css.listGroup}>
								<div className={css.category}>
									<CheckBox
										isChecked={sourcesByReason[reason].every(s => selectedSourceIds.includes(s.id))}
										onChange={isChecked => {
											const newSourceIds = selectedSourceIds.filter(
												id => !sources.find(s => s.id === id),
											);
											setSelectedSourceIds(
												isChecked ? [...newSourceIds, ...sources.map(s => s.id)] : newSourceIds,
											);
										}}
									/>
									<div className={css.categoryReason}>
										{
											{
												[FeedReason.BALANCE]: 'Tokens you hold',
												[FeedReason.PROTOCOL]: 'Projects you have position in',
												[FeedReason.TRANSACTION]: 'Projects you used',
												[FeedReason.NONE]: 'Others',
											}[reason]
										}
									</div>
									<div className={css.categoryProject}>Token / Project</div>
								</div>

								<div>
									{sources.map(source => (
										<Row
											key={source.id}
											source={source}
											isSelected={selectedSourceIds.includes(source.id)}
											onSelect={isSelected =>
												setSelectedSourceIds(prev =>
													toggleArrayItem(prev, source.id, isSelected),
												)
											}
										/>
									))}
								</div>
							</div>
						))
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
						isDisabled={!selectedSourceIds.length || saveConfigMutation.isLoading}
						look={ActionButtonLook.PRIMARY}
						onClick={() => saveConfigMutation.mutate()}
					>
						Save Settings
					</ActionButton>

					<ActionButton isDisabled={saveConfigMutation.isLoading} onClick={() => onClose?.()}>
						Cancel
					</ActionButton>
				</div>

				<div className={css.footerRight}>
					{data ? (
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
