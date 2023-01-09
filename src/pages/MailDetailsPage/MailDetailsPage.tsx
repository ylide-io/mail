import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo } from 'react';
import { createReactEditorJS } from 'react-editor-js';
import { useParams } from 'react-router-dom';

import { ActionButton, ActionButtonStyle } from '../../components/ActionButton/ActionButton';
import { smallButtonIcons } from '../../components/smallButton/smallButton';
import { AdaptiveAddress } from '../../controls/AdaptiveAddress';
import { Blockie } from '../../controls/Blockie';
import { IMessageDecodedContent } from '../../indexedDB/MessagesDB';
import { GenericLayout } from '../../layouts/GenericLayout';
import contacts from '../../stores/Contacts';
import mailbox from '../../stores/Mailbox';
import { FolderId, ILinkedMessage, useMailList, useMailStore } from '../../stores/MailList';
import { EDITOR_JS_TOOLS } from '../../utils/editorJs';
import { useNav } from '../../utils/navigate';

const ReactEditorJS = createReactEditorJS();

export const MailDetailsPage = observer(() => {
	const navigate = useNav();
	const { id } = useParams();

	const { lastActiveFolderId, lastMessagesList, decodedMessagesById, deletedMessageIds, markMessagesAsDeleted } =
		useMailStore();

	const message = lastMessagesList.find(m => m.id === id!);
	const decoded: IMessageDecodedContent | undefined = message && decodedMessagesById[message.msgId];
	const contact = contacts.contactsByAddress[message?.msg.senderAddress || '-1'];

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

	const data = useMemo(
		() => ({
			blocks:
				typeof decoded?.decodedTextData === 'string'
					? JSON.parse(decoded.decodedTextData).blocks
					: toJS(decoded?.decodedTextData?.blocks),
		}),
		[decoded?.decodedTextData],
	);

	const replyClickHandler = () => {
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

	const forwardClickHandler = () => {
		mailbox.textEditorData = decoded?.decodedTextData || '';
		mailbox.subject = decoded?.decodedSubject || '';
		navigate('/mail/compose');
	};

	const deleteHandler = () => {
		markMessagesAsDeleted([message!]);
		navigate(`/${lastActiveFolderId}`);
	};

	return (
		<GenericLayout
			mobileTopButtonProps={{
				text: '‹ Return to Mailbox',
				link: `/mail/${lastActiveFolderId}`,
			}}
		>
			{message && decoded && (
				<div className="mail-page animated fadeInRight">
					<div className="mail-top">
						<div className="mail-header">
							<h2 className="mailbox-title">
								{decoded ? decoded.decodedSubject || 'View Message' : 'View Message'}
							</h2>
							<div className="mail-actions">
								<ActionButton
									onClick={replyClickHandler}
									icon={<i className={`fa ${smallButtonIcons.reply}`} />}
								>
									Reply
								</ActionButton>

								<ActionButton
									style={ActionButtonStyle.Dengerous}
									onClick={deleteHandler}
									icon={<i className={`fa ${smallButtonIcons.trash}`} />}
								>
									Archive
								</ActionButton>
							</div>
						</div>
						<div className="mail-meta">
							<div className="mail-params">
								<div className="mmp-row">
									<div className="mmp-row-title mmp-from">Sender:</div>
									<div className="mmp-row-value">
										{contact ? (
											<div className="mail-contact-name">{contact.name}</div>
										) : (
											<div className="mail-sender">
												<Blockie
													className="mail-sender-blockie"
													address={message.msg.senderAddress}
												/>{' '}
												<div className="mail-sender-address">
													<AdaptiveAddress address={message.msg.senderAddress} />
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
							<div className="mail-date">
								{moment.unix(message.msg.createdAt).format('HH:mm DD.MM.YYYY')}
							</div>
						</div>
					</div>
					<div className="mail-body" style={{ minHeight: 370 }}>
						{data.blocks && (
							<ReactEditorJS
								tools={EDITOR_JS_TOOLS}
								readOnly={true}
								//@ts-ignore
								data={data}
							/>
						)}
					</div>
					<div className="mail-footer">
						<ActionButton
							onClick={replyClickHandler}
							icon={<i className={`fa ${smallButtonIcons.reply}`} />}
						>
							Reply
						</ActionButton>

						<ActionButton
							onClick={forwardClickHandler}
							icon={<i className={`fa ${smallButtonIcons.forward}`} />}
						>
							Forward
						</ActionButton>
					</div>
				</div>
			)}
		</GenericLayout>
	);
});
