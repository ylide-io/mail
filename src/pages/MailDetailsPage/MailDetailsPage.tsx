import React, { useCallback, useEffect, useRef, useState } from 'react';
import { generatePath, useParams } from 'react-router-dom';

import { ActionButton } from '../../components/ActionButton/ActionButton';
import { ContactName } from '../../components/contactName/contactName';
import { GenericLayout } from '../../components/genericLayout/genericLayout';
import { Spinner } from '../../components/spinner/spinner';
import { BackIcon } from '../../icons/BackIcon';
import { ContactIcon } from '../../icons/ContactIcon';
import { ForwardIcon } from '../../icons/ForwardIcon';
import { ReplyIcon } from '../../icons/ReplyIcon';
import { IMessageDecodedContent } from '../../indexedDB/MessagesDB';
import mailbox from '../../stores/Mailbox';
import { FolderId, ILinkedMessage, useMailList, useMailStore } from '../../stores/MailList';
import { RoutePath } from '../../stores/routePath';
import { decodeEditorData } from '../../utils/editorJs';
import { useNav } from '../../utils/navigate';
import css from './MailDetailsPage.module.scss';
import { MailMessage } from './MailMessage/MailMessage';

interface WrappedThreadMessage {
	message: ILinkedMessage;
	isDeleted: boolean;
}

export const MailDetailsPage = () => {
	const navigate = useNav();
	const { folderId, id } = useParams<{ folderId: FolderId; id: string }>();

	const {
		lastMessagesList,
		decodedMessagesById,
		deletedMessageIds,
		markMessagesAsDeleted,
		markMessagesAsNotDeleted,
		markMessagesAsReaded,
		decodeMessage,
	} = useMailStore();

	const initialMessage = lastMessagesList.find(m => m.id === id!);
	const initialDecodedContent: IMessageDecodedContent | undefined =
		initialMessage && decodedMessagesById[initialMessage.msgId];

	useEffect(() => {
		if (id && initialDecodedContent) {
			markMessagesAsReaded([id]);
		}
	}, [id, initialDecodedContent, markMessagesAsReaded]);

	useEffect(() => {
		if (!initialMessage || !initialDecodedContent) {
			navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: folderId! }));
		}
	}, [initialDecodedContent, folderId, initialMessage, navigate]);

	//

	const primaryThreadItemRef = useRef<HTMLDivElement>(null);

	const [needToLoadThread, setNeedToLoadThread] = useState(
		folderId === FolderId.Inbox && initialMessage?.msg.senderAddress,
	);
	const [isLoadingThread, setLoadingThread] = useState(needToLoadThread);
	const [isDecodingThread, setDecodingThread] = useState(false);
	const [isThreadOpen, setThreadOpen] = useState(false);

	const threadFilter = useCallback(
		(m: ILinkedMessage) => {
			const { id, recipient } = m;
			const isDeleted = deletedMessageIds[recipient?.account.address || 'null']?.has(id);
			return !isDeleted;
		},
		[deletedMessageIds],
	);

	const {
		messages: threadMessages,
		isLoading,
		isNextPageAvailable,
		loadNextPage,
	} = useMailList(
		needToLoadThread
			? {
					folderId: FolderId.Inbox,
					sender: initialMessage?.msg.senderAddress,
					filter: threadFilter,
			  }
			: undefined,
	);

	const [wrappedThreadMessages, setWrappedThreadMessages] = useState<WrappedThreadMessage[]>([]);

	useEffect(() => {
		if (!isNextPageAvailable) {
			setWrappedThreadMessages(
				threadMessages.map(it => ({
					message: it,
					isDeleted: false,
				})),
			);

			setNeedToLoadThread(false);
			setLoadingThread(false);
		} else if (!isLoading) {
			loadNextPage();
		}
	}, [decodeMessage, isLoading, isNextPageAvailable, loadNextPage, threadMessages]);

	const onOpenThreadClick = () => {
		setDecodingThread(true);

		(async () => {
			for (const m of wrappedThreadMessages) {
				console.log('decodeMessage');
				await decodeMessage(m.message);
			}

			setDecodingThread(false);
			setThreadOpen(true);
		})();
	};

	const onPrimaryThreadMessageReady = () => {
		primaryThreadItemRef.current?.scrollIntoView();
	};

	//

	const onBackClick = () => {
		navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: folderId! }));
	};

	const onReplyClick = (senderAddress: string, subject: string | null) => {
		mailbox.to = [senderAddress];
		mailbox.subject = subject || '';
		navigate(RoutePath.MAIL_COMPOSE);
	};

	const onForwardClick = (decodedTextData: string | null, subject: string | null) => {
		mailbox.editorData = decodeEditorData(decodedTextData);
		mailbox.subject = subject || '';
		navigate(RoutePath.MAIL_COMPOSE);
	};

	const onDeleteClick = (m: ILinkedMessage) => {
		markMessagesAsDeleted([m]);

		if (isThreadOpen) {
			setWrappedThreadMessages(
				wrappedThreadMessages.map(it => (it.message.msgId === m.msgId ? { ...it, isDeleted: true } : it)),
			);
		} else {
			navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: folderId! }));
		}
	};

	const onRestoreClick = (m: ILinkedMessage) => {
		markMessagesAsNotDeleted([m]);

		setWrappedThreadMessages(
			wrappedThreadMessages.map(it => (it.message.msgId === m.msgId ? { ...it, isDeleted: false } : it)),
		);
	};

	//

	return (
		<GenericLayout mainClass={css.layout}>
			{initialMessage && initialDecodedContent && (
				<div className={css.root}>
					<div className={css.header}>
						<ActionButton onClick={onBackClick} icon={<BackIcon />} />

						{isLoadingThread || isDecodingThread ? (
							<Spinner className={css.headerSpinner} />
						) : isThreadOpen ? (
							<div className={css.messagesFrom}>
								<div className={css.messagesFromLebel}>Messages from</div>
								<ContactName address={initialMessage.msg.senderAddress} />
							</div>
						) : (
							wrappedThreadMessages.length > 1 && (
								<ActionButton icon={<ContactIcon />} onClick={onOpenThreadClick}>
									{wrappedThreadMessages.length} messages from this sender
								</ActionButton>
							)
						)}
					</div>

					<div className={css.messageWrapper}>
						{isThreadOpen ? (
							wrappedThreadMessages.map(message => {
								const decoded = decodedMessagesById[message.message.msgId];
								const isPrimaryItem = message.message.id === initialMessage.id;

								return (
									<div
										ref={isPrimaryItem ? primaryThreadItemRef : undefined}
										className={css.messageThreadItem}
									>
										{message.isDeleted ? (
											<div className={css.deletedPlaceholder}>
												This message was archived
												<div>
													<ActionButton onClick={() => onRestoreClick(message.message)}>
														Restore
													</ActionButton>
												</div>
											</div>
										) : (
											<MailMessage
												message={message.message}
												decoded={decoded}
												folderId={folderId}
												onReady={isPrimaryItem ? onPrimaryThreadMessageReady : undefined}
												onReplyClick={() =>
													onReplyClick(
														message.message.msg.senderAddress,
														decoded.decodedSubject,
													)
												}
												onForwardClick={() =>
													onForwardClick(decoded.decodedTextData, decoded.decodedSubject)
												}
												onDeleteClick={() => onDeleteClick(message.message)}
											/>
										)}
									</div>
								);
							})
						) : (
							<MailMessage
								message={initialMessage}
								decoded={initialDecodedContent}
								folderId={folderId}
								onReplyClick={() =>
									onReplyClick(initialMessage.msg.senderAddress, initialDecodedContent.decodedSubject)
								}
								onForwardClick={() =>
									onForwardClick(
										initialDecodedContent.decodedTextData,
										initialDecodedContent.decodedSubject,
									)
								}
								onDeleteClick={() => onDeleteClick(initialMessage)}
							/>
						)}
					</div>

					{isThreadOpen || (
						<div className={css.footer}>
							<ActionButton
								onClick={() =>
									onReplyClick(initialMessage.msg.senderAddress, initialDecodedContent.decodedSubject)
								}
								icon={<ReplyIcon />}
							>
								Reply
							</ActionButton>

							<ActionButton
								onClick={() =>
									onForwardClick(
										initialDecodedContent.decodedTextData,
										initialDecodedContent.decodedSubject,
									)
								}
								icon={<ForwardIcon />}
							>
								Forward
							</ActionButton>
						</div>
					)}
				</div>
			)}
		</GenericLayout>
	);
};
