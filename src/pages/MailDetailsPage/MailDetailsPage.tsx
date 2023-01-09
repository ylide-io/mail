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
import { FolderId, ILinkedMessage, useMailStore } from '../../stores/MailList';
import { EDITOR_JS_TOOLS } from '../../utils/editorJs';
import { useNav } from '../../utils/navigate';

const ReactEditorJS = createReactEditorJS();

interface MailDetailsPageInnerProps {
	message: ILinkedMessage;
}

const MailDetailsPageInner = observer(({ message }: MailDetailsPageInnerProps) => {
	const navigate = useNav();
	const { lastActiveFolderId, decodedMessagesById, decodeMessage, markMessagesAsReaded, markMessagesAsDeleted } =
		useMailStore();
	const decoded: IMessageDecodedContent | undefined = decodedMessagesById[message.msgId];
	const contact = contacts.contactsByAddress[message.msg.senderAddress || '-1'];

	useEffect(() => {
		(async () => {
			if (!decoded) {
				await decodeMessage(message);
			}
			await markMessagesAsReaded([message.id]);
		})();
	}, [decodeMessage, decoded, markMessagesAsReaded, message]);

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
		markMessagesAsDeleted([message]);
		navigate(`/${lastActiveFolderId}`);
	};

	return (
		<GenericLayout
			mobileTopButtonProps={{
				text: '‹ Return to Mailbox',
				link: `/mail/${lastActiveFolderId}`,
			}}
		>
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

export const MailDetailsPage = () => {
	const navigate = useNav();
	const { id } = useParams();

	const lastMessagesList = useMailStore(state => state.lastMessagesList);
	const message = lastMessagesList.find(m => m.id === id!);

	useEffect(() => {
		if (!message) {
			navigate(`/mail/${FolderId.Inbox}`);
		}
	}, [message, navigate]);

	return <>{message && <MailDetailsPageInner message={message} />}</>;
};
