import React, { useEffect } from 'react';
import GenericLayout from '../layouts/GenericLayout';
import { smallButtonColors, smallButtonIcons } from '../components/smallButton/smallButton';
import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react';
import { createReactEditorJS } from 'react-editor-js';
import { toJS } from 'mobx';
import { EDITOR_JS_TOOLS } from '../utils/editorJs';
import mailbox from '../stores/Mailbox';
import contacts from '../stores/Contacts';
import { useNav } from '../utils/navigate';
import moment from 'moment';
import mailList from '../stores/MailList';
import { IMessageDecodedContent } from '../indexedDB/MessagesDB';
import { CalendarOutlined } from '@ant-design/icons';
import { parseEventFileString } from '../utils/eventFileString';
import CollapsedText from '../components/CollapsedText/CollapsedText';
import { Button } from 'antd';
import { Blockie } from '../controls/Blockie';
import { AdaptiveAddress } from '../controls/AdaptiveAddress';

const ReactEditorJS = createReactEditorJS();

const MailDetail = observer(() => {
	const navigate = useNav();
	const { id } = useParams();
	const message = mailList.messages.find(m => m.id === id!)!;
	const decoded: IMessageDecodedContent | undefined = mailList.decodedMessagesById[message.msgId];
	const contact = contacts.contactsByAddress[message.msg.senderAddress || '-1'];

	console.log('decoded: ', decoded);
	console.log('message: ', message);

	useEffect(() => {
		if (!message) return;
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

	const rawData = (() => {
		// console.log('decoded.decodedTextData: ', decoded.decodedTextData);
		if (typeof decoded?.decodedTextData === 'string') {
			return {
				blocks: JSON.parse(decoded.decodedTextData).blocks,
			};
		} else {
			return { blocks: toJS(decoded?.decodedTextData?.blocks) };
		}
	})();

	const { data, eventData } = (() => {
		if (!Array.isArray(rawData.blocks)) {
			return { data: rawData, eventData: undefined };
		}

		const eventFileBlockIndex = rawData.blocks.findIndex((item: { data: { text: string }, type: string }) => {
			return item.type === 'calendarEvent';
		});

		if (eventFileBlockIndex < 0) {
			return { data: rawData, eventData: undefined };
		}

		const eventFileData = parseEventFileString(rawData.blocks[eventFileBlockIndex].data.text);
		rawData.blocks.splice(eventFileBlockIndex, 1);


		return {
			data: rawData, eventData: eventFileData
		};

	})();

	const downloadUrl = URL.createObjectURL(new Blob([eventData?.originalFile || ''], {
		type: "text/plain;charset=utf-8"
	}));

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
		navigate('/compose');
	};

	const forwardClickHandler = () => {
		mailbox.textEditorData = decoded?.decodedTextData || '';
		mailbox.subject = decoded?.decodedSubject || '';
		navigate('/compose');
	};

	const deleteHandler = () => {
		if (message) {
			mailList.markMessageAsDeleted(message);
			navigate(`/${mailList.activeFolderId}`);
		}
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
							<Button
								size="small"
								type="dashed"
								onClick={replyClickHandler}
								color={smallButtonColors.white}
								icon={<i className={`fa ${smallButtonIcons.reply}`} />}
							>
								Reply
							</Button>

							<Button
								size="small"
								type="dashed"
								danger
								onClick={deleteHandler}
								color={smallButtonColors.white}
								icon={<i className={`fa ${smallButtonIcons.trash}`} />}
							>
								Archive
							</Button>
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
				{eventData && <div className='event-box'>
					<h3 className='font-bold'>
						<span style={{ verticalAlign: 'bottom' }}>
							<CalendarOutlined style={{ fontSize: '22px' }} />
						</span> {eventData?.summary}
					</h3>
					<a href={downloadUrl} rel="noreferrer noopener" target={'_blank'} download={'invite.ics'}>Download invite</a>
					<div className='event-box-details'>
						<table>
							<tbody>
								<tr>
									<td className='event-box-label font-bold'>Start</td>
									<td>{eventData?.start}</td>
									<td className='event-box-label font-bold'>End</td>
									<td>{eventData?.end}</td>
								</tr>
								<tr>
									<td className='event-box-label font-bold'>Where</td>
									<td>{eventData?.location}</td>
									<td className='event-box-label font-bold'>Who</td>
									<td>{eventData?.attendees}</td>
								</tr>
								<tr>
									<td className='event-box-label font-bold'>Description</td>
									<td style={{whiteSpace: 'pre-line'}} colSpan={3}>
										<CollapsedText text={eventData?.description || ''} collapseCount={250} />
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>}
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
					<Button
						size="small"
						type="dashed"
						onClick={replyClickHandler}
						color={smallButtonColors.white}
						icon={<i className={`fa ${smallButtonIcons.reply}`} />}
					>
						Reply
					</Button>
					<Button
						size="small"
						type="dashed"
						onClick={forwardClickHandler}
						color={smallButtonColors.white}
						icon={<i className={`fa ${smallButtonIcons.forward}`} />}
					>
						Forward
					</Button>
				</div>
			</div>
		</GenericLayout>
	);
});

export default MailDetail;
