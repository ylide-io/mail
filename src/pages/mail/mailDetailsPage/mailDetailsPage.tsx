import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { generatePath, useParams } from 'react-router-dom';

import { ActionButton } from '../../../components/ActionButton/ActionButton';
import { ContactName } from '../../../components/contactName/contactName';
import { ErrorMessage } from '../../../components/errorMessage/errorMessage';
import { OverlappingLoader } from '../../../components/overlappingLoader/overlappingLoader';
import { Spinner } from '../../../components/spinner/spinner';
import { toast } from '../../../components/toast/toast';
import { ReactComponent as ArrowLeftSvg } from '../../../icons/ic20/arrowLeft.svg';
import { ReactComponent as ContactSvg } from '../../../icons/ic20/contact.svg';
import { ReactComponent as ForwardSvg } from '../../../icons/ic20/forward.svg';
import { ReactComponent as ReplySvg } from '../../../icons/ic20/reply.svg';
import { IMessageDecodedContent } from '../../../indexedDB/IndexedDB';
import { analytics } from '../../../stores/Analytics';
import domain from '../../../stores/Domain';
import { FolderId, getFolderName, ILinkedMessage, MailList, mailStore } from '../../../stores/MailList';
import { OutgoingMailData, Recipients } from '../../../stores/outgoingMailData';
import { RoutePath } from '../../../stores/routePath';
import { invariant } from '../../../utils/assert';
import { DateFormatStyle, formatDate } from '../../../utils/date';
import {
	decodedTextDataToEditorJsData,
	formatSubject,
	plainTextToEditorJsData,
	useOpenMailCompose,
} from '../../../utils/mail';
import { ReactQueryKey } from '../../../utils/reactQuery';
import { truncateAddress } from '../../../utils/string';
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
	invariant(folderId);
	invariant(id);

	const openMailCompose = useOpenMailCompose();

	const accounts = domain.accounts.activeAccounts;

	const messageQuery = useQuery(
		ReactQueryKey.mailDetails(
			id,
			accounts.map(a => a.account.address),
		),
		{
			queryFn: async () => {
				let message = mailStore.lastMessagesList.find(m => m.id === id!);

				if (!message) {
					const { msgId, address } = ILinkedMessage.parseId(id);

					const domainAccount = accounts.find(a => a.account.address === address);
					invariant(domainAccount, () => {
						toast(`Connect account ${truncateAddress(address)} to read this message 👍`);
						return 'No account';
					});

					const msg = await domain.getMessageByMsgId(msgId);
					invariant(msg, `Could not find message ${msgId}`);

					message = await ILinkedMessage.fromIMessage(folderId, msg, domainAccount);
				}

				let decoded = mailStore.decodedMessagesById[message.msgId];

				if (!decoded) {
					await mailStore.decodeMessage(message.msgId, message.msg, message.recipient?.account);
					decoded = mailStore.decodedMessagesById[message.msgId];
					invariant(decoded, 'No decoded');
				}

				mailStore.markMessagesAsReaded([id]);

				return {
					message,
					decoded,
				};
			},
		},
	);

	const initialMessage = messageQuery.data?.message;
	const initialDecoded = messageQuery.data?.decoded;

	//

	const primaryThreadItemRef = useRef<HTMLDivElement>(null);

	const [isDecodingThread, setDecodingThread] = useState(false);
	const [isThreadOpen, setThreadOpen] = useState(false);

	const deletedMessageIds = mailStore.deletedMessageIds;

	const threadMailList = useMemo(() => {
		if (folderId !== FolderId.Inbox || !initialMessage?.msg.senderAddress) return;

		const list = new MailList();

		list.init({
			mailbox: {
				accounts,
				folderId: FolderId.Inbox,
				sender: initialMessage?.msg.senderAddress,
				filter: (id: string) => !deletedMessageIds.has(id),
			},
		});

		return list;
	}, [accounts, deletedMessageIds, folderId, initialMessage?.msg.senderAddress]);

	useEffect(() => () => threadMailList?.destroy(), [threadMailList]);

	const [wrappedThreadMessages, setWrappedThreadMessages] = useState<WrappedThreadMessage[]>([]);

	useEffect(
		() =>
			autorun(() => {
				if (!threadMailList || !threadMailList.isActive) return;

				if (!threadMailList.isNextPageAvailable) {
					setWrappedThreadMessages(
						threadMailList.messages.map(it => ({
							message: it,
							isDeleted: false,
						})),
					);
				} else if (!threadMailList.isLoading && !threadMailList.isError) {
					threadMailList.loadNextPage();
				}
			}),
		[threadMailList],
	);

	const onOpenThreadClick = () => {
		setDecodingThread(true);

		(async () => {
			for (const m of wrappedThreadMessages) {
				await mailStore.decodeMessage(m.message.msgId, m.message.msg, m.message.recipient?.account);
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
		navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: folderId! }), { goBackIfPossible: true });
	};

	const onReplyClick = (senderAddress: string, subject: string | null) => {
		const mailData = new OutgoingMailData();
		mailData.to = new Recipients([senderAddress]);
		mailData.subject = formatSubject(subject || '', 'Re: ');

		openMailCompose({ mailData, place: 'mail-details_reply' });
	};

	const onForwardClick = (message: ILinkedMessage, decodedContent: IMessageDecodedContent) => {
		const editorData = decodedTextDataToEditorJsData(decodedContent.decodedTextData);
		if (editorData) {
			const forwardedData = plainTextToEditorJsData(
				`\n${[
					'---------- Forwarded message ---------',
					`From: ${message.msg.senderAddress}`,
					`Date: ${formatDate(message.msg.createdAt * 1000, DateFormatStyle.LONG)}`,
					`Subject: ${formatSubject(decodedContent.decodedSubject)}`,
					`To: ${message.recipient?.account.address || message.msg.recipientAddress}`,
				]
					.map(l => `<div>${l}</div>`)
					.join('')}\n`,
			);

			editorData.blocks = [...forwardedData.blocks, ...editorData.blocks];
		}

		const mailData = new OutgoingMailData();
		mailData.editorData = editorData;
		mailData.subject = formatSubject(decodedContent.decodedSubject.replace(/^Fwd:\s+/i, ''), 'Fwd: ');

		openMailCompose({ mailData, place: 'mail-details_forward' });
	};

	const onDeleteClick = (m: ILinkedMessage) => {
		analytics.archiveMail('details', 1);
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
		analytics.restoreMail('details', 1);
		mailStore.markMessagesAsNotDeleted([m]);

		setWrappedThreadMessages(
			wrappedThreadMessages.map(it => (it.message.msgId === m.msgId ? { ...it, isDeleted: false } : it)),
		);
	};

	//

	return (
		<div className={css.root}>
			{initialMessage && initialDecoded ? (
				<>
					<div className={css.header}>
						<ActionButton onClick={onBackClick} icon={<ArrowLeftSvg />}>
							{getFolderName(folderId)}
						</ActionButton>

						{threadMailList?.isLoading || isDecodingThread ? (
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
												onForwardClick={() => onForwardClick(message.message, decoded)}
												onDeleteClick={() => onDeleteClick(message.message)}
											/>
										)}
									</div>
								);
							})
						) : (
							<MailMessage
								message={initialMessage}
								decoded={initialDecoded}
								folderId={folderId}
								onReplyClick={() =>
									onReplyClick(initialMessage.msg.senderAddress, initialDecoded.decodedSubject)
								}
								onForwardClick={() => onForwardClick(initialMessage, initialDecoded)}
								onDeleteClick={() => onDeleteClick(initialMessage)}
							/>
						)}
					</div>

					{isThreadOpen || (
						<div className={css.footer}>
							<ActionButton
								onClick={() =>
									onReplyClick(initialMessage.msg.senderAddress, initialDecoded.decodedSubject)
								}
								icon={<ReplySvg />}
							>
								Reply
							</ActionButton>

							<ActionButton
								onClick={() => onForwardClick(initialMessage, initialDecoded)}
								icon={<ForwardSvg />}
							>
								Forward
							</ActionButton>
						</div>
					)}
				</>
			) : messageQuery.isLoading ? (
				<OverlappingLoader text="Loading message ..." />
			) : (
				<ErrorMessage style={{ margin: 20 }}>Couldn't load this message 😒</ErrorMessage>
			)}
		</div>
	);
});
