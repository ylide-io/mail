import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { ActionButton } from '../../components/ActionButton/ActionButton';
import { Spinner } from '../../components/spinner/spinner';
import { AdaptiveAddress } from '../../controls/AdaptiveAddress';
import { BackIcon } from '../../icons/BackIcon';
import { ContactIcon } from '../../icons/ContactIcon';
import { ForwardIcon } from '../../icons/ForwardIcon';
import { ReplyIcon } from '../../icons/ReplyIcon';
import { IMessageDecodedContent } from '../../indexedDB/MessagesDB';
import { GenericLayout } from '../../layouts/GenericLayout';
import mailbox from '../../stores/Mailbox';
import { FolderId, ILinkedMessage, useMailList, useMailStore } from '../../stores/MailList';
import { useNav } from '../../utils/navigate';
import css from './MailDetailsPage.module.scss';
import { MailMessage } from './MailMessage/MailMessage';

interface WrappedThreadMessage {
	message: ILinkedMessage;
	isDeleted: boolean;
}

export const MailDetailsPage = () => {
	const navigate = useNav();
	const { folderId, id } = useParams();

	const {
		lastMessagesList,
		decodedMessagesById,
		deletedMessageIds,
		markMessagesAsDeleted,
		markMessagesAsNotDeleted,
		decodeMessage,
	} = useMailStore();

	const message = lastMessagesList.find(m => m.id === id!);
	const decoded: IMessageDecodedContent | undefined = message && decodedMessagesById[message.msgId];

	useEffect(() => {
		if (!message || !decoded) {
			navigate(`/mail/${folderId}`);
		}
	}, [decoded, folderId, message, navigate]);

	//

	const [needToLoadThread, setNeedToLoadThread] = useState(folderId === FolderId.Inbox && message?.msg.senderAddress);
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
					sender: message?.msg.senderAddress,
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

	//

	const onBackClick = () => {
		navigate(`/mail/${folderId}`);
	};

	const onReplyClick = (senderAddress: string, subject: string | null) => {
		mailbox.to = [
			{
				type: 'address',
				loading: false,
				isAchievable: null,
				input: senderAddress,
				address: senderAddress,
			},
		];
		mailbox.subject = subject || '';
		navigate('/mail/compose');
	};

	const onForwardClick = (decodedTextData: any | null, subject: string | null) => {
		mailbox.textEditorData = decodedTextData || '';
		mailbox.subject = subject || '';
		navigate('/mail/compose');
	};

	const onDeleteClick = (m: ILinkedMessage) => {
		markMessagesAsDeleted([m]);

		if (isThreadOpen) {
			setWrappedThreadMessages(
				wrappedThreadMessages.map(it => (it.message.msgId === m.msgId ? { ...it, isDeleted: true } : it)),
			);
		} else {
			navigate(`/mail/${folderId}`);
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
			{message && decoded && (
				<div className={css.root}>
					<div className={css.header}>
						<ActionButton onClick={onBackClick} icon={<BackIcon />} />

						{isLoadingThread || isDecodingThread ? (
							<Spinner className={css.headerSpinner} />
						) : isThreadOpen ? (
							<div className={css.messagesFrom}>
								<div className={css.messagesFromLebel}>Messages from</div>
								<AdaptiveAddress address={message.msg.senderAddress} />
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
							wrappedThreadMessages.map(it => {
								const d = decodedMessagesById[it.message.msgId];

								return (
									<div className={css.messageThreadItem}>
										{it.isDeleted ? (
											<div className={css.deletedPlaceholder}>
												This message was archived
												<div>
													<ActionButton onClick={() => onRestoreClick(it.message)}>
														Restore
													</ActionButton>
												</div>
											</div>
										) : (
											<MailMessage
												message={it.message}
												decoded={d}
												onReplyClick={() =>
													onReplyClick(it.message.msg.senderAddress, d.decodedSubject)
												}
												onForwardClick={() =>
													onForwardClick(d.decodedTextData, d.decodedSubject)
												}
												onDeleteClick={() => onDeleteClick(it.message)}
											/>
										)}
									</div>
								);
							})
						) : (
							<MailMessage
								message={message}
								decoded={decoded}
								onReplyClick={() => onReplyClick(message.msg.senderAddress, decoded.decodedSubject)}
								onForwardClick={() => onForwardClick(decoded.decodedTextData, decoded.decodedSubject)}
								onDeleteClick={() => onDeleteClick(message)}
							/>
						)}
					</div>

					{isThreadOpen || (
						<div className={css.footer}>
							<ActionButton
								onClick={() => onReplyClick(message.msg.senderAddress, decoded.decodedSubject)}
								icon={<ReplyIcon />}
							>
								Reply
							</ActionButton>

							<ActionButton
								onClick={() => onForwardClick(decoded.decodedTextData, decoded.decodedSubject)}
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
