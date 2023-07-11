import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { useMemo, useState } from 'react';
import { useMutation } from 'react-query';

import { FeedReason, FeedSource } from '../../../../api/feedServerApi';
import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { Avatar } from '../../../../components/avatar/avatar';
import { CheckBox } from '../../../../components/checkBox/checkBox';
import { ErrorMessage } from '../../../../components/errorMessage/errorMessage';
import { Modal } from '../../../../components/modal/modal';
import { OverlappingLoader } from '../../../../components/overlappingLoader/overlappingLoader';
import { TextField, TextFieldLook } from '../../../../components/textField/textField';
import { toast } from '../../../../components/toast/toast';
import { DASH } from '../../../../constants';
import { ReactComponent as ContactSvg } from '../../../../icons/ic20/contact.svg';
import { ReactComponent as SearchSvg } from '../../../../icons/ic28/search.svg';
import { feedSettings } from '../../../../stores/FeedSettings';
import { DomainAccount } from '../../../../stores/models/DomainAccount';
import { toggleArrayItem } from '../../../../utils/array';
import { invariant } from '../../../../utils/assert';
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

		<div className={css.sourceProject}>{source.cryptoProject?.name || DASH}</div>
	</div>
));

//

type FeedReasonOrEmpty = FeedReason | '';

export interface FeedSettingsPopupProps {
	account: DomainAccount;
	onClose?: () => void;
}

export const FeedSettingsPopup = observer(({ account, onClose }: FeedSettingsPopupProps) => {
	invariant(account.mainViewKey, 'FeedSettings only supports MV accounts');

	const config = feedSettings.getAccountConfig(account);
	const [selectedSourceIds, setSelectedSourceIds] = useState(feedSettings.getSelectedSourceIds(account));

	const [isSearchOpen, setSearchOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');

	const sourcesByReason = useMemo(() => {
		const sources = feedSettings.sources
			.slice()
			.sort(
				(a, b) =>
					b.type.localeCompare(a.type) ||
					(a.origin || '').localeCompare(b.origin || '') ||
					a.name.localeCompare(b.name),
			);

		const filteredSources = sources.filter(source => {
			const term = searchTerm.trim().toLowerCase();
			if (!term) return true;

			return source.name.toLowerCase().includes(term) || source.origin?.toLowerCase().includes(term);
		});

		const grouped = filteredSources.reduce((res, s) => {
			const reason = s.cryptoProjectReasons[0] || '';
			const list = (res[reason] = res[reason] || []);
			list.push(s);
			return res;
		}, {} as Record<FeedReasonOrEmpty, FeedSource[]>);

		return (Object.keys(grouped) as FeedReasonOrEmpty[])
			.sort((a: FeedReasonOrEmpty, b: FeedReasonOrEmpty) => {
				const getOrder = (reason: FeedReasonOrEmpty) =>
					reason
						? {
								[FeedReason.BALANCE]: 1,
								[FeedReason.PROTOCOL]: 2,
								[FeedReason.TRANSACTION]: 3,
						  }[reason]
						: 4;

				return getOrder(a) - getOrder(b);
			})
			.reduce(
				(res, reason) => ({ ...res, [reason]: grouped[reason] }),
				{} as Record<FeedReasonOrEmpty, FeedSource[]>,
			);
	}, [searchTerm]);

	const saveConfigMutation = useMutation({
		mutationFn: () => feedSettings.updateFeedConfig(account, selectedSourceIds),
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
				{config ? (
					Object.keys(sourcesByReason).length ? (
						(Object.entries(sourcesByReason) as [FeedReasonOrEmpty, FeedSource[]][]).map(
							([reason, sources]) => (
								<div className={css.listGroup}>
									<div className={css.category}>
										<CheckBox
											isChecked={sourcesByReason[reason].every(s =>
												selectedSourceIds.includes(s.id),
											)}
											onChange={isChecked => {
												const newSourceIds = selectedSourceIds.filter(
													id => !sources.find(s => s.id === id),
												);
												setSelectedSourceIds(
													isChecked
														? [...newSourceIds, ...sources.map(s => s.id)]
														: newSourceIds,
												);
											}}
										/>
										<div className={css.categoryReason}>
											{reason
												? {
														[FeedReason.BALANCE]: 'Tokens you hold',
														[FeedReason.PROTOCOL]: 'Projects you have position in',
														[FeedReason.TRANSACTION]: 'Projects you used',
												  }[reason]
												: 'Others'}
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
							),
						)
					) : (
						<div className={css.noData}>- No sources found -</div>
					)
				) : feedSettings.isError ? (
					<ErrorMessage className={css.error}>Couldn't load source list</ErrorMessage>
				) : (
					<OverlappingLoader text="Loading sources ..." />
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
					{config ? (
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
