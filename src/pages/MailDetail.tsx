import React, { useEffect } from 'react';
import MainLayout from '../layouts/mainLayout';
import SmallButton, { smallButtonColors, smallButtonIcons } from '../components/smallButton/smallButton';
import { useParams } from 'react-router-dom';
import mailer from '../stores/Mailer';
import { observer } from 'mobx-react';
import { createReactEditorJS } from 'react-editor-js';
import { toJS } from 'mobx';
import { EDITOR_JS_TOOLS } from '../utils/editorJs';
import mailbox from '../stores/Mailbox';
import contacts from '../stores/Contacts';
import { useNav } from '../utils/navigate';
import moment from 'moment';

const ReactEditorJS = createReactEditorJS();

const MailDetail = observer(() => {
	return null;
	// const navigate = useNav();
	// const { id } = useParams();
	// const message = mailer.inboxMessages.find(m => m.link.msgId === id!)!;
	// const decoded = mailer.decodedMessagesById[id!];
	// const contact = contacts.contactsByAddress[message?.link.senderAddress || '-1'];

	// useEffect(() => {
	// 	if (!message) return;
	// 	(async () => {
	// 		if (!decoded) {
	// 			await mailer.decodeMessage(message);
	// 		}
	// 		await mailer.readMessage(message.link.msgId);
	// 	})();
	// }, [decoded, message]);

	// const encodedMessageClickHandler = () => {
	// 	mailer.decodeMessage(message);
	// };

	// const data = (() => {
	// 	console.log('decoded.decodedTextData: ', decoded.decodedTextData);
	// 	if (typeof decoded.decodedTextData === 'string') {
	// 		return {
	// 			blocks: JSON.parse(decoded.decodedTextData).blocks,
	// 		};
	// 	} else {
	// 		return { blocks: toJS(decoded.decodedTextData?.blocks) };
	// 	}
	// })();

	// const replyClickHandler = () => {
	// 	mailbox.to = message.link.senderAddress
	// 		? [
	// 				{
	// 					type: 'address',
	// 					loading: false,
	// 					isAchievable: null,
	// 					input: message.link.senderAddress,
	// 					address: message.link.senderAddress,
	// 				},
	// 		  ]
	// 		: [];
	// 	mailbox.subject = decoded?.decodedSubject || '';
	// 	navigate('/compose');
	// };

	// const forwardClickHandler = () => {
	// 	mailbox.textEditorData = decoded?.decodedTextData || '';
	// 	mailbox.subject = decoded?.decodedSubject || '';
	// 	navigate('/compose');
	// };

	// const deleteHandler = () => {
	// 	if (message) {
	// 		mailer.deleteMessage(message.link.msgId);
	// 	}
	// };

	// return (
	// 	<MainLayout>
	// 		<div className="col-lg-9 animated fadeInRight">
	// 			<div className="mail-box-header">
	// 				<div className="float-right tooltip-demo tooltip-buttons-space">
	// 					<SmallButton
	// 						onClick={replyClickHandler}
	// 						color={smallButtonColors.white}
	// 						icon={smallButtonIcons.reply}
	// 						title={'Reply'}
	// 						text={'Reply'}
	// 					/>
	// 					<SmallButton
	// 						onClick={deleteHandler}
	// 						color={smallButtonColors.white}
	// 						icon={smallButtonIcons.trash}
	// 						title={'Move to trash'}
	// 					/>
	// 				</div>
	// 				<h2>{decoded ? decoded.decodedSubject || 'View Message' : 'View Message'}</h2>
	// 				<div className="mail-tools tooltip-demo m-t-md">
	// 					{/* <h3>
	// 						<span className="font-normal">Subject: </span>
	// 						<span
	// 							onClick={encodedMessageClickHandler}
	// 							style={
	// 								!decoded
	// 									? {
	// 											filter: 'blur(5px)',
	// 											cursor: 'pointer',
	// 									  }
	// 									: {}
	// 							}
	// 						>
	// 							{decoded ? decoded.decodedSubject || 'No subject' : 'Message is not decoded'}
	// 						</span>
	// 					</h3> */}
	// 					<h5>
	// 						<span className="float-right font-normal">
	// 							{message && (
	// 								<div>
	// 									<span style={{ marginLeft: 6 }}>
	// 										{moment.unix(message.link.createdAt).format('HH:mm DD.MM.YYYY')}
	// 									</span>
	// 								</div>
	// 							)}
	// 						</span>
	// 						<span className="font-normal">From: </span>
	// 						<span>{contact ? contact.name : message.link.senderAddress}</span>
	// 					</h5>
	// 				</div>
	// 			</div>
	// 			<div className="mail-box">
	// 				<div className="mail-body" style={{ minHeight: 370 }}>
	// 					{data.blocks ? (
	// 						<ReactEditorJS
	// 							tools={EDITOR_JS_TOOLS}
	// 							readOnly={true}
	// 							//@ts-ignore
	// 							data={data}
	// 						/>
	// 					) : (
	// 						<div
	// 							onClick={encodedMessageClickHandler}
	// 							style={
	// 								!decoded
	// 									? {
	// 											filter: 'blur(5px)',
	// 											cursor: 'pointer',
	// 									  }
	// 									: {}
	// 							}
	// 						>
	// 							Message is not decoded yet
	// 						</div>
	// 					)}
	// 				</div>
	// 				<div className="mail-body text-right tooltip-demo tooltip-buttons-space">
	// 					<SmallButton
	// 						onClick={replyClickHandler}
	// 						color={smallButtonColors.white}
	// 						icon={smallButtonIcons.reply}
	// 						title={'Reply'}
	// 						text={'Reply'}
	// 					/>
	// 					<SmallButton
	// 						onClick={forwardClickHandler}
	// 						color={smallButtonColors.white}
	// 						icon={smallButtonIcons.forward}
	// 						title={'Forward'}
	// 						text={'Forward'}
	// 					/>
	// 				</div>
	// 				<div className="clearfix"></div>
	// 			</div>
	// 		</div>
	// 	</MainLayout>
	// );
});

export default MailDetail;
