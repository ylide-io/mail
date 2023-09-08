import clsx from 'clsx';
import sortBy from 'lodash.sortby';
import { observer } from 'mobx-react';
import { useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';

import { FeedReason, FeedReasonOrEmpty, FeedSource } from '../../../../api/feedServerApi';
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
import { feedSettings, getReasonOrder } from '../../../../stores/FeedSettings';
import { DomainAccount } from '../../../../stores/models/DomainAccount';
import { toggleArrayItem } from '../../../../utils/array';
import { invariant } from '../../../../utils/assert';
import { reloadFeed } from '../../feedPage/feedPage';
import { FeedLinkTypeIcon } from '../feedLinkTypeIcon/feedLinkTypeIcon';
import css from './feedSettingsPopup.module.scss';

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

	const [sourcesByReason, rows] = useMemo(() => {
		const config = feedSettings.getAccountConfig(account);

		const sources = feedSettings.sources.slice().filter(source => {
			const term = searchTerm.trim().toLowerCase();
			if (!term) return true;

			return source.name.toLowerCase().includes(term) || source.origin?.toLowerCase().includes(term);
		});

		const grouped = sources.reduce((res, s) => {
			const cryptoProjectId = s.cryptoProject?.id;
			const cryptoProject =
				(cryptoProjectId && config?.defaultProjects.find(p => p.projectId === cryptoProjectId)) || undefined;
			const reasons = cryptoProject?.reasons || [''];
			for (const reason of reasons) {
				if (
					reason === 'balance' ||
					reason === 'protocol' ||
					reason === '' ||
					(reasons.length === 1 && reason === 'transaction')
				) {
					const list = (res[reason] = res[reason] || []);
					list.push(s);
				}
			}
			return res;
		}, {} as Record<FeedReasonOrEmpty, FeedSource[]>);

		const aggregated = getReasonOrder(Object.keys(grouped) as FeedReasonOrEmpty[]).reduce((res, reason) => {
			const withoutProjects: FeedSource[] = [];
			const withProjects: FeedSource[] = [];
			for (const source of grouped[reason]) {
				if (source.cryptoProject?.name) {
					withProjects.push(source);
				} else {
					withoutProjects.push(source);
				}
			}
			return {
				...res,
				[reason]: sortBy(
					withProjects
						.sort((b, a) => b.cryptoProject!.name.localeCompare(a.cryptoProject!.name))
						.concat(withoutProjects),
					(s: FeedSource) => !selectedSourceIds.includes(s.id),
				),
			};
		}, {} as Record<FeedReasonOrEmpty, FeedSource[]>);

		return [aggregated, (Object.entries(aggregated) as [FeedReasonOrEmpty, FeedSource[]][]).flat(2)];
		// do not include selectedSourceIds,
		// we don't want to sort during checkbox toggle
	}, [account, searchTerm]);

	const saveConfigMutation = useMutation({
		mutationFn: () => feedSettings.updateFeedConfig(account, selectedSourceIds),
		onSuccess: () => {
			onClose?.();
			reloadFeed();
		},
		onError: () => toast("Couldn't save your feed settings. Please try again."),
	});

	const Row = ({
		index,
		data,
		style,
	}: {
		index: number;
		data: (FeedSource | FeedReasonOrEmpty)[];
		style: React.CSSProperties;
	}) => {
		const source = data[index];
		if (typeof source === 'string') {
			const reason = source;
			return (
				<div className={css.category} key={`row-${index}`} style={style}>
					<CheckBox
						isChecked={sourcesByReason[reason].every(s => selectedSourceIds.includes(s.id))}
						onChange={isChecked => {
							const newSourceIds = selectedSourceIds.filter(
								id => !sourcesByReason[reason].find(s => typeof s !== 'string' && s.id === id),
							);
							console.log(selectedSourceIds);
							console.log(newSourceIds);
							setSelectedSourceIds(
								isChecked ? [...newSourceIds, ...sourcesByReason[reason].map(s => s.id)] : newSourceIds,
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
							: Object.keys(sourcesByReason).length === 1
							? 'Source'
							: 'Other sources'}
					</div>
					<div className={css.categoryProject}>Token / Project</div>
				</div>
			);
		}
		return (
			<div
				key={`row-${index}-${source.id}`}
				className={clsx(css.row, css.row_data, index % 2 === 0 ? css.row_2 : '')}
				style={style}
			>
				<CheckBox
					className={css.sourceCheckBox}
					isChecked={selectedSourceIds.includes(source.id)}
					onChange={isSelected => setSelectedSourceIds(prev => toggleArrayItem(prev, source.id, isSelected))}
				/>

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
		);
	};

	return (
		<Modal className={css.root} onClose={onClose}>
			<div className={css.header}>
				<div className={css.title}>Feed Settings</div>
				<div className={css.description}>Select sources you want to see in your Feed</div>
			</div>

			{config ? (
				<div style={{ flex: '1 1 auto' }}>
					<AutoSizer>
						{({ width, height }) => (
							<List width={width} height={height} itemSize={40} itemCount={rows.length} itemData={rows}>
								{Row}
							</List>
						)}
					</AutoSizer>
				</div>
			) : feedSettings.isError ? (
				<ErrorMessage className={css.error}>Couldn't load source list</ErrorMessage>
			) : (
				<OverlappingLoader text="Loading sources ..." />
			)}
			<div className={css.footer}>
				<div className={css.footerLeft}>
					<ActionButton
						isDisabled={saveConfigMutation.isLoading}
						look={ActionButtonLook.PRIMARY}
						onClick={() => saveConfigMutation.mutate()}
					>
						Save Settings
					</ActionButton>
				</div>

				<div className={css.footerRight}>
					{config &&
						(isSearchOpen ? (
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
						))}
				</div>
			</div>
		</Modal>
	);
});
