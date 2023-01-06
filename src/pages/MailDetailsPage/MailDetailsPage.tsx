import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import moment from 'moment';
import React, { useEffect, useMemo } from 'react';
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
import mailList, { FolderId, ILinkedMessage } from '../../stores/MailList';
import { EDITOR_JS_TOOLS } from '../../utils/editorJs';
import { useNav } from '../../utils/navigate';

const ReactEditorJS = createReactEditorJS();

interface MailDetailsPageInnerProps {
	message: ILinkedMessage;
}

const MailDetailsPageInner = observer(({ message }: MailDetailsPageInnerProps) => {
	const navigate = useNav();
	const decoded: IMessageDecodedContent | undefined = mailList.decodedMessagesById[message.msgId];
	const contact = contacts.contactsByAddress[message.msg.senderAddress || '-1'];

	console.log('decoded: ', decoded);
	console.log('message: ', message);

	useEffect(() => {
		(async () => {
			if (!decoded) {
				await mailList.decodeMessage(message);
			}
			await mailList.markMessageAsReaded(message.id);
		})();
	}, [decoded, message]);

	const encodedMessageClickHandler = () => {
		mailList.decodeMessage(message);
	};

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
		mailbox.to = message.msg.senderAddress
			? [
					{
						type: 'address',
						loading: false,
						isAchievable: null,
						input: message.msg.senderAddress,
						address: message.msg.senderAddress,
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
		mailList.markMessageAsDeleted(message);
		navigate(`/${mailList.activeFolderId}`);
	};

	return (
		<GenericLayout>
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
						<div className="mail-date">{moment.unix(message.msg.createdAt).format('HH:mm DD.MM.YYYY')}</div>
					</div>
				</div>
				<div className="mail-body" style={{ minHeight: 370 }}>
					{data.blocks ? (
						<ReactEditorJS
							tools={EDITOR_JS_TOOLS}
							readOnly={true}
							//@ts-ignore
							data={data}
						/>
					) : (
						<div
							onClick={encodedMessageClickHandler}
							style={
								!decoded
									? {
											filter: 'blur(5px)',
											cursor: 'pointer',
									  }
									: {}
							}
						>
							Message is not decoded yet
						</div>
					)}
				</div>
				<div className="mail-footer">
					<ActionButton onClick={replyClickHandler} icon={<i className={`fa ${smallButtonIcons.reply}`} />}>
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
		</GenericLayout>
	);
});

export const MailDetailsPage = observer(() => {
	const { id } = useParams();
	const navigate = useNav();
	const message = mailList.messages.find(m => m.id === id!);

	useEffect(() => {
		if (!message) {
			navigate(`/mail/${FolderId.Inbox}`);
		}
	}, [message, navigate]);

	return <>{message && <MailDetailsPageInner message={message} />}</>;
});
