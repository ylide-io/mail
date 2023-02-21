import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

import { GenericLayout } from '../../components/genericLayout/genericLayout';
import { YlideLoader } from '../../components/ylideLoader/ylideLoader';
import { analytics } from '../../stores/Analytics';
import domain from '../../stores/Domain';
import { FolderId, ILinkedMessage, useMailList, useMailStore } from '../../stores/MailList';
import { RoutePath } from '../../stores/routePath';
import { useNav } from '../../utils/url';
import { useWindowSize } from '../../utils/useWindowSize';
import MailboxEmpty from './components/MailboxEmpty';
import { MailboxHeader } from './components/MailboxHeader';
import MailboxListRow from './components/MailboxListRow/MailboxListRow';

/*
Rendering lists using FixedSizeList requires that rows doen't access any variables from the parent component.
Otherwise all rows will be re-mounted on every render.
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
		<div style={Object.assign({ height: itemSize, textAlign: 'center' }, style)}>Loading...</div>
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

export const MailboxPage = () => {
	const navigate = useNav();
	const { setLastActiveFolderId, setLastMessagesList, markMessagesAsReaded } = useMailStore();

	const params = useParams<{ folderId: FolderId }>();
	const [searchParams] = useSearchParams();

	const folderId = params.folderId || FolderId.Inbox;
	const filterBySender = searchParams.get('sender') || undefined;

	useEffect(() => {
		analytics.mailFolderOpened(folderId);
		setLastActiveFolderId(folderId);
	}, [folderId, setLastActiveFolderId]);

	const { deletedMessageIds, markMessagesAsDeleted, markMessagesAsNotDeleted } = useMailStore();

	const messageFilter = useCallback(
		(m: ILinkedMessage) => {
			const { id, recipient } = m;
			const isDeleted = deletedMessageIds[recipient?.account.address || 'null']?.has(id);

			return folderId === FolderId.Archive ? isDeleted : !isDeleted;
		},
		[deletedMessageIds, folderId],
	);

	const { messages, isLoading, isNextPageAvailable, loadNextPage } = useMailList({
		folderId: folderId!,
		sender: filterBySender,
		filter: messageFilter,
	});

	useEffect(() => setLastMessagesList(messages), [setLastMessagesList, messages]);

	const [selectedMessageIds, setSelectedMessageIds] = useState(new Set<string>());
	const isAllSelected = !!messages.length && messages.every(it => selectedMessageIds.has(it.id));

	const { windowWidth } = useWindowSize();
	const isHighRow = windowWidth <= 630;
	const itemSize = isHighRow ? 80 : 40;

	const [scrollParams, setScrollParams] = useState({
		offset: 0,
		height: 0,
	});

	useEffect(() => {
		const itemsHeight = itemSize * messages.length;
		const offsetToEnd = itemsHeight - (scrollParams.height + scrollParams.offset);
		if (offsetToEnd < itemSize && isNextPageAvailable && !isLoading) {
			loadNextPage();
		}
	}, [itemSize, scrollParams, isLoading, messages.length, isNextPageAvailable, loadNextPage]);

	return (
		<GenericLayout mobileTopButtonProps={{ text: 'Compose Mail', link: RoutePath.MAIL_COMPOSE }}>
			<div className="mailbox-page animated fadeInRight">
				<MailboxHeader
					folderId={folderId!}
					filterBySender={filterBySender}
					isAllSelected={isAllSelected}
					onSelectAllCheckBoxClick={isChecked => {
						setSelectedMessageIds(isChecked ? new Set(messages.map(it => it.id)) : new Set());
					}}
					isActionButtonsDisabled={!selectedMessageIds.size}
					onMarkReadClick={() => {
						markMessagesAsReaded(Array.from(selectedMessageIds)).then();
						setSelectedMessageIds(new Set());
					}}
					onDeleteClick={() => {
						markMessagesAsDeleted(messages.filter(it => selectedMessageIds.has(it.id))).then();
						setSelectedMessageIds(new Set());
					}}
					onRestoreClick={() => {
						markMessagesAsNotDeleted(messages.filter(it => selectedMessageIds.has(it.id))).then();
						setSelectedMessageIds(new Set());
					}}
				/>

				<div className="mailbox">
					{isLoading && !messages.length ? (
						<div style={{ padding: '40px 0' }}>
							<YlideLoader
								reason={`Retrieving your mails from ${
									Object.keys(domain.blockchains).length
								} blockchains`}
							/>
						</div>
					) : messages.length ? (
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
											messages,
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
										itemCount={messages.length + (isNextPageAvailable ? 1 : 0)}
									>
										{MailboxListItem}
									</FixedSizeList>
								);
							}}
						</AutoSizer>
					) : (
						<MailboxEmpty folderId={folderId!} />
					)}
				</div>
			</div>
		</GenericLayout>
	);
};
