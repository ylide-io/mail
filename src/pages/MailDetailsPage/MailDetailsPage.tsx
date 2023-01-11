import React, { useCallback, useEffect, useRef, useState } from 'react';
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

export const MailDetailsPage = () => {
	const navigate = useNav();
	const { folderId, id } = useParams();

	const { lastMessagesList, decodedMessagesById, deletedMessageIds, markMessagesAsDeleted, decodeMessage } =
		useMailStore();

	const message = lastMessagesList.find(m => m.id === id!);
	const decoded: IMessageDecodedContent | undefined = message && decodedMessagesById[message.msgId];

	useEffect(() => {
		if (!message || !decoded) {
			navigate(`/mail/${folderId}`);
		}
	}, [decoded, folderId, message, navigate]);

	//

	const canLoadThread = folderId === FolderId.Inbox && message?.msg.senderAddress;

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
		canLoadThread
			? {
					folderId: FolderId.Inbox,
					sender: message?.msg.senderAddress,
					filter: threadFilter,
			  }
			: undefined,
	);

	const [isLoadingThread, setLoadingThread] = useState(canLoadThread);
	const isThreadDecodedRef = useRef(false);

	useEffect(() => {
		if (isThreadDecodedRef.current) return;

		if (!isNextPageAvailable) {
			isThreadDecodedRef.current = true;

			(async () => {
				for (const m of threadMessages) {
					console.log('decodeMessage');
					await decodeMessage(m);
				}

				setLoadingThread(false);
			})();
		} else if (!isLoading) {
			loadNextPage();
		}
	}, [decodeMessage, isLoading, isNextPageAvailable, loadNextPage, threadMessages]);

	const [isShowingThread, setShowingThread] = useState(false);

	const onShowThreadClick = () => {
		setShowingThread(true);
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
		navigate(`/mail/${folderId}`);
	};

	//

	return (
		<GenericLayout
			mainClass={css.layout}
			mobileTopButtonProps={{
				text: '‹ Return to Mailbox',
				link: `/mail/${folderId}`,
			}}
		>
			{message && decoded && (
				<div className={css.root}>
					<div className={css.header}>
						<ActionButton onClick={onBackClick} icon={<BackIcon />} />

						{isLoadingThread ? (
							<Spinner className={css.headerSpinner} />
						) : isShowingThread ? (
							<div className={css.messagesFrom}>
								<div className={css.secondaryText}>Messages from</div>
								<AdaptiveAddress address={message.msg.senderAddress} />
							</div>
						) : (
							threadMessages.length > 1 && (
								<ActionButton icon={<ContactIcon />} onClick={onShowThreadClick}>
									{threadMessages.length} messages from this sender
								</ActionButton>
							)
						)}
					</div>

					<div className={css.messageWrapper}>
						{isShowingThread ? (
							threadMessages.map(m => {
								const d = decodedMessagesById[m.msgId];

								return (
									<div className={css.messageThreadItem}>
										<MailMessage
											message={m}
											decoded={d}
											onReplyClick={() => onReplyClick(m.msg.senderAddress, d.decodedSubject)}
											onForwardClick={() => onForwardClick(d.decodedTextData, d.decodedSubject)}
											onDeleteClick={() => onDeleteClick(m)}
										/>
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

					{isShowingThread || (
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
