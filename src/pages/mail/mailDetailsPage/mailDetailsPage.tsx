import { observer } from 'mobx-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { generatePath, useParams } from 'react-router-dom';

import { ActionButton } from '../../../components/ActionButton/ActionButton';
import { ContactName } from '../../../components/contactName/contactName';
import { FullPageContent } from '../../../components/genericLayout/content/fullPageContent/fullPageContent';
import { GenericLayout } from '../../../components/genericLayout/genericLayout';
import { Recipients } from '../../../components/recipientInput/recipientInput';
import { Spinner } from '../../../components/spinner/spinner';
import { ReactComponent as ArrowLeftSvg } from '../../../icons/ic20/arrowLeft.svg';
import { ReactComponent as ContactSvg } from '../../../icons/ic20/contact.svg';
import { ReactComponent as ForwardSvg } from '../../../icons/ic20/forward.svg';
import { ReactComponent as ReplySvg } from '../../../icons/ic20/reply.svg';
import { IMessageDecodedContent, MessageDecodedContentType } from '../../../indexedDB/IndexedDB';
import { FolderId, ILinkedMessage, mailStore, useMailList } from '../../../stores/MailList';
import { globalOutgoingMailData, OutgoingMailData } from '../../../stores/outgoingMailData';
import { RoutePath } from '../../../stores/routePath';
import { DateFormatStyle, formatDate } from '../../../utils/date';
import { decodeEditorData, plainTextToEditorData } from '../../../utils/editorJs';
import { formatSubject, useOpenMailCopmpose } from '../../../utils/mail';
import { useNav } from '../../../utils/url';
import css from './mailDetailsPage.module.scss';
import { MailMessage } from './mailMessage/mailMessage';

interface WrappedThreadMessage {
	message: ILinkedMessage;
	isDeleted: boolean;
}

export const MailDetailsPage = observer(() => {
	const navigate = useNav();
	const { folderId, id } = useParams<{ folderId: FolderId; id: string }>();

	const openMailCopmpose = useOpenMailCopmpose();

	const initialMessage = mailStore.lastMessagesList.find(m => m.id === id!);
	const initialDecodedContent: IMessageDecodedContent | undefined =
		initialMessage && mailStore.decodedMessagesById[initialMessage.msgId];

	useEffect(() => {
		if (id && initialDecodedContent) {
			mailStore.markMessagesAsReaded([id]);
		}
	}, [id, initialDecodedContent]);

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

	const deletedMessageIds = mailStore.deletedMessageIds;

	const threadFilter = useCallback((id: string) => !deletedMessageIds.has(id), [deletedMessageIds]);

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
	}, [isLoading, isNextPageAvailable, loadNextPage, threadMessages]);

	const onOpenThreadClick = () => {
		setDecodingThread(true);

		(async () => {
			for (const m of wrappedThreadMessages) {
				console.log('decodeMessage');
				await mailStore.decodeMessage(m.message);
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
		const mailData = new OutgoingMailData();
		mailData.to = new Recipients([senderAddress]);
		mailData.subject = formatSubject(subject || '', 'Re: ');

		openMailCopmpose({ mailData });
	};

	const onForwardClick = (message: ILinkedMessage, decodedTextData: string | null, subject: string | null) => {
		const editorData = decodeEditorData(decodedTextData);
		if (editorData) {
			const forwardedData = plainTextToEditorData(
				`\n${[
					'---------- Forwarded message ---------',
					`From: ${message.msg.senderAddress}`,
					`Date: ${formatDate(message.msg.createdAt * 1000, DateFormatStyle.LONG)}`,
					`Subject: ${formatSubject(subject)}`,
					`To: ${message.recipient?.account.address || message.msg.recipientAddress}`,
				].join('<br>')}\n`,
			);

			editorData.blocks = [...forwardedData.blocks, ...editorData.blocks];
		}

		globalOutgoingMailData.editorData = editorData;
		globalOutgoingMailData.subject = formatSubject(subject?.replace(/^Fwd:\s+/i, ''), 'Fwd: ');

		navigate(RoutePath.MAIL_COMPOSE);
	};

	const onDeleteClick = (m: ILinkedMessage) => {
		mailStore.markMessagesAsDeleted([m]);

		if (isThreadOpen) {
			setWrappedThreadMessages(
				wrappedThreadMessages.map(it => (it.message.msgId === m.msgId ? { ...it, isDeleted: true } : it)),
			);
		} else {
			navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: folderId! }));
		}
	};

	const onRestoreClick = (m: ILinkedMessage) => {
		mailStore.markMessagesAsNotDeleted([m]);

		setWrappedThreadMessages(
			wrappedThreadMessages.map(it => (it.message.msgId === m.msgId ? { ...it, isDeleted: false } : it)),
		);
	};

	//

	return (
		<GenericLayout>
			<FullPageContent className={css.layout}>
				{initialMessage && initialDecodedContent && (
					<div className={css.root}>
						<div className={css.header}>
							<ActionButton onClick={onBackClick} icon={<ArrowLeftSvg />} />

							{isLoadingThread || isDecodingThread ? (
								<Spinner className={css.headerSpinner} />
							) : isThreadOpen ? (
								<div className={css.messagesFrom}>
									<div className={css.messagesFromLebel}>Messages from</div>
									<ContactName address={initialMessage.msg.senderAddress} />
								</div>
							) : (
								wrappedThreadMessages.length > 1 && (
									<ActionButton icon={<ContactSvg />} onClick={onOpenThreadClick}>
										{wrappedThreadMessages.length} messages from this sender
									</ActionButton>
								)
							)}
						</div>

						<div className={css.messageWrapper}>
							{isThreadOpen ? (
								wrappedThreadMessages.map(message => {
									const decoded = mailStore.decodedMessagesById[message.message.msgId];
									const isPrimaryItem = message.message.id === initialMessage.id;

									return (
										<div
											key={message.message.id}
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
														onForwardClick(
															message.message,
															decoded.decodedTextData
																? decoded.decodedTextData.type ===
																  MessageDecodedContentType.YMF
																	? decoded.decodedTextData.value.toString()
																	: decoded.decodedTextData.value
																: null,
															decoded.decodedSubject,
														)
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
										onReplyClick(
											initialMessage.msg.senderAddress,
											initialDecodedContent.decodedSubject,
										)
									}
									onForwardClick={() =>
										onForwardClick(
											initialMessage,
											initialDecodedContent.decodedTextData
												? initialDecodedContent.decodedTextData.type ===
												  MessageDecodedContentType.YMF
													? initialDecodedContent.decodedTextData.value.toString()
													: initialDecodedContent.decodedTextData.value
												: null,
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
										onReplyClick(
											initialMessage.msg.senderAddress,
											initialDecodedContent.decodedSubject,
										)
									}
									icon={<ReplySvg />}
								>
									Reply
								</ActionButton>

								<ActionButton
									onClick={() =>
										onForwardClick(
											initialMessage,
											initialDecodedContent.decodedTextData
												? initialDecodedContent.decodedTextData.type ===
												  MessageDecodedContentType.YMF
													? initialDecodedContent.decodedTextData.value.toString()
													: initialDecodedContent.decodedTextData.value
												: null,
											initialDecodedContent.decodedSubject,
										)
									}
									icon={<ForwardSvg />}
								>
									Forward
								</ActionButton>
							</div>
						)}
					</div>
				)}
			</FullPageContent>
		</GenericLayout>
	);
});
