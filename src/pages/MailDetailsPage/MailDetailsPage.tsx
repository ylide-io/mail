import React, { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { ActionButton } from '../../components/ActionButton/ActionButton';
import { smallButtonIcons } from '../../components/smallButton/smallButton';
import { IMessageDecodedContent } from '../../indexedDB/MessagesDB';
import { GenericLayout } from '../../layouts/GenericLayout';
import mailbox from '../../stores/Mailbox';
import { FolderId, ILinkedMessage, useMailList, useMailStore } from '../../stores/MailList';
import { useNav } from '../../utils/navigate';
import css from './MailDetailsPage.module.scss';
import { MailMessage } from './MailMessage/MailMessage';

export const MailDetailsPage = () => {
	const navigate = useNav();
	const { id } = useParams();

	const { lastActiveFolderId, lastMessagesList, decodedMessagesById, deletedMessageIds, markMessagesAsDeleted } =
		useMailStore();

	const message = lastMessagesList.find(m => m.id === id!);
	const decoded: IMessageDecodedContent | undefined = message && decodedMessagesById[message.msgId];

	useEffect(() => {
		if (!message || !decoded) {
			navigate(`/mail/${FolderId.Inbox}`);
		}
	}, [decoded, message, navigate]);

	const threadFilter = useCallback(
		(m: ILinkedMessage) => {
			const { id, recipient } = m;
			const isDeleted = deletedMessageIds[recipient?.account.address || 'null']?.has(id);
			return !isDeleted;
		},
		[deletedMessageIds],
	);

	const { messages } = useMailList(
		lastActiveFolderId === FolderId.Inbox && message?.msg.senderAddress
			? {
					folderId: FolderId.Inbox,
					sender: message?.msg.senderAddress,
					filter: threadFilter,
			  }
			: undefined,
	);

	const onReplyClick = () => {
		mailbox.to = message!.msg.senderAddress
			? [
					{
						type: 'address',
						loading: false,
						isAchievable: null,
						input: message!.msg.senderAddress,
						address: message!.msg.senderAddress,
					},
			  ]
			: [];
		mailbox.subject = decoded?.decodedSubject || '';
		navigate('/mail/compose');
	};

	const onForwardClick = () => {
		mailbox.textEditorData = decoded?.decodedTextData || '';
		mailbox.subject = decoded?.decodedSubject || '';
		navigate('/mail/compose');
	};

	const onDeleteClick = () => {
		markMessagesAsDeleted([message!]);
		navigate(`/mail/${lastActiveFolderId}`);
	};

	return (
		<GenericLayout
			mainClass={css.layout}
			mobileTopButtonProps={{
				text: '‹ Return to Mailbox',
				link: `/mail/${lastActiveFolderId}`,
			}}
		>
			{message && decoded && (
				<div className={css.root}>
					<div className={css.messageWrapper}>
						<MailMessage
							message={message}
							decoded={decoded}
							onReplyClick={onReplyClick}
							onForwardClick={onForwardClick}
							onDeleteClick={onDeleteClick}
						/>
					</div>

					<div className={css.footer}>
						<ActionButton onClick={onReplyClick} icon={<i className={`fa ${smallButtonIcons.reply}`} />}>
							Reply
						</ActionButton>

						<ActionButton
							onClick={onForwardClick}
							icon={<i className={`fa ${smallButtonIcons.forward}`} />}
						>
							Forward
						</ActionButton>
					</div>
				</div>
			)}
		</GenericLayout>
	);
};
