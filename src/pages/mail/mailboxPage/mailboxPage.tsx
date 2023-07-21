import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useSearchParams } from 'react-router-dom';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

import { ErrorMessage } from '../../../components/errorMessage/errorMessage';
import { FullPageContent } from '../../../components/genericLayout/content/fullPageContent/fullPageContent';
import { GenericLayout } from '../../../components/genericLayout/genericLayout';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { analytics } from '../../../stores/Analytics';
import { browserStorage } from '../../../stores/browserStorage';
import domain, { useDomainAccounts } from '../../../stores/Domain';
import { FolderId, ILinkedMessage, MailList, mailStore } from '../../../stores/MailList';
import { useNav } from '../../../utils/url';
import { useWindowSize } from '../../../utils/useWindowSize';
import MailboxEmpty from './mailboxEmpty/mailboxEmpty';
import { MailboxHeader } from './mailboxHeader/mailboxHeader';
import MailboxListRow from './mailboxListRow/mailboxListRow';

/*
Rendering lists using FixedSizeList requires that rows doesn't access any variables from the parent component.
Otherwise, all rows will be re-mounted on every render.
That's why we extracted it into a separate component.
 */
interface MailboxListItemData {
	messages: ILinkedMessage[];
	itemSize: number;
	isSelected: (messageId: string) => boolean;
	onSelectClick: (messageId: string, isSelected: boolean) => void;
	onFilterBySenderClick?: (senderAddress: string) => void;
}

export function MailboxListItem({ index, style, data }: ListChildComponentProps<MailboxListItemData>) {
	const { messages, itemSize, isSelected, onSelectClick, onFilterBySenderClick } = data;
	const message = messages[index];

	return index === messages.length ? (
		<div
			key={index}
			style={Object.assign(
				{ height: itemSize, display: 'flex', alignItems: 'center', justifyContent: 'center' },
				style,
			)}
		>
			Loading...
		</div>
	) : (
		<MailboxListRow
			key={index}
			message={message}
			style={style}
			isSelected={isSelected(message.id)}
			onCheckBoxClick={value => onSelectClick(message.id, value)}
			onFilterBySenderClick={onFilterBySenderClick && (() => onFilterBySenderClick(message.msg.senderAddress))}
		/>
	);
}

export const MailboxPage = observer(() => {
	const navigate = useNav();

	const params = useParams<{ folderId: FolderId }>();
	const [searchParams] = useSearchParams();

	const folderId = params.folderId || FolderId.Inbox;
	const filterBySender = searchParams.get('sender') || undefined;

	useEffect(() => {
		mailStore.lastActiveFolderId = folderId;
		analytics.mailFolderOpened(folderId);
	}, [folderId]);

	const deletedMessageIds = mailStore.deletedMessageIds;

	const accounts = useDomainAccounts();

	const mailList = useMemo(() => {
		const list = new MailList(true);

		list.init({
			mailbox: {
				accounts,
				folderId: folderId!,
				sender: filterBySender,
				filter: (id: string) => {
					const isDeleted = deletedMessageIds.has(id);
					return folderId === FolderId.Archive ? isDeleted : !isDeleted;
				},
			},
		});

		return list;
	}, [accounts, deletedMessageIds, filterBySender, folderId]);

	useEffect(() => () => mailList.destroy(), [mailList]);

	useEffect(() => autorun(() => (mailStore.lastMessagesList = mailList.messages)), [mailList]);

	const [selectedMessageIds, setSelectedMessageIds] = useState(new Set<string>());
	const isAllSelected = !!mailList.messages.length && mailList.messages.every(it => selectedMessageIds.has(it.id));

	const { windowWidth } = useWindowSize();
	const isHighRow = windowWidth <= 720;
	const itemSize = isHighRow ? 80 : 40;

	const [scrollParams, setScrollParams] = useState({
		offset: 0,
		height: 0,
	});

	useEffect(
		() =>
			autorun(() => {
				const itemsHeight = itemSize * mailList.messages.length;
				const offsetToEnd = itemsHeight - (scrollParams.height + scrollParams.offset);
				if (
					offsetToEnd < itemSize &&
					mailList.isNextPageAvailable &&
					!mailList.isLoading &&
					!mailList.isError
				) {
					mailList.loadNextPage();
				}
			}),
		[itemSize, mailList, scrollParams],
	);

	useEffect(() => {
		if (folderId === FolderId.Inbox) {
			const key = accounts
				.map(a => a.account.address)
				.sort()
				.join(',');
			browserStorage.lastMailboxCheckDate = {
				...browserStorage.lastMailboxCheckDate,
				[key]: Math.floor(Date.now() / 1000),
			};
		}
	}, [folderId, accounts]);

	return (
		<GenericLayout>
			<Helmet>
				<title>Decentralized Web3 Mailbox by Ylide for secure and private communication</title>
				<meta
					name="description"
					content="Experience the power of decentralized communication with Ylide's Web3 Mailbox. Supporting multiple chains including Ethereum, Polygon, BNB, Venom Blockchain, Gnosis chain, Celo, Moonriver, Klaytn, Moonbeam, Avalanche, Aurora, Fantom, Metis, Arbitrum, Optimism, and Everscale. Secure, private, and built for the future of the web."
				/>
			</Helmet>

			<FullPageContent>
				<div className="mailbox-page">
					<MailboxHeader
						folderId={folderId!}
						messages={mailList.messages}
						selectedMessageIds={selectedMessageIds}
						filterBySender={filterBySender}
						isAllSelected={isAllSelected}
						onSelectAllCheckBoxClick={isChecked => {
							setSelectedMessageIds(isChecked ? new Set(mailList.messages.map(it => it.id)) : new Set());
						}}
						onMarkReadClick={() => {
							analytics.markMailAsRead(selectedMessageIds.size);
							mailStore.markMessagesAsReaded(Array.from(selectedMessageIds));
							setSelectedMessageIds(new Set());
						}}
						onDeleteClick={() => {
							analytics.archiveMail('mailbox', selectedMessageIds.size);
							mailStore.markMessagesAsDeleted(
								mailList.messages.filter(it => selectedMessageIds.has(it.id)),
							);
							setSelectedMessageIds(new Set());
						}}
						onRestoreClick={() => {
							analytics.restoreMail('mailbox', selectedMessageIds.size);
							mailStore.markMessagesAsNotDeleted(
								mailList.messages.filter(it => selectedMessageIds.has(it.id)),
							);
							setSelectedMessageIds(new Set());
						}}
					/>

					<div className="mailbox">
						{mailList.messages.length ? (
							<AutoSizer>
								{({ width, height }) => {
									// noinspection JSUnusedGlobalSymbols
									return (
										<FixedSizeList<MailboxListItemData>
											itemSize={itemSize}
											width={width}
											height={height}
											style={{ padding: '0 0 12px' }}
											itemData={{
												messages: mailList.messages,
												itemSize,
												isSelected: (messageId: string) => selectedMessageIds.has(messageId),
												onSelectClick: (messageId: string, isSelected: boolean) => {
													const newSet = new Set(selectedMessageIds.values());
													isSelected ? newSet.add(messageId) : newSet.delete(messageId);

													setSelectedMessageIds(newSet);
												},
												onFilterBySenderClick:
													folderId === FolderId.Inbox && !filterBySender
														? (senderAddress: string) => {
																navigate({
																	search: { sender: senderAddress },
																});
														  }
														: undefined,
											}}
											onScroll={props => {
												setScrollParams({
													offset: props.scrollOffset,
													height,
												});
											}}
											itemCount={
												mailList.messages.length + (mailList.isNextPageAvailable ? 1 : 0)
											}
										>
											{MailboxListItem}
										</FixedSizeList>
									);
								}}
							</AutoSizer>
						) : mailList.isLoading ? (
							<div style={{ padding: '40px 0' }}>
								<YlideLoader
									reason={`Retrieving your mails from ${
										Object.keys(domain.blockchains).length
									} blockchains`}
								/>
							</div>
						) : mailList.isError ? (
							<div style={{ padding: '40px' }}>
								<ErrorMessage>Couldn't load messages.</ErrorMessage>
							</div>
						) : (
							<MailboxEmpty folderId={folderId!} />
						)}
					</div>
				</div>
			</FullPageContent>
		</GenericLayout>
	);
});
