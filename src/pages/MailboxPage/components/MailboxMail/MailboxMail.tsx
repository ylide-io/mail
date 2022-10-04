import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import contacts from '../../../../stores/Contacts';
import { isToday } from '../../../../utils/date';
import './MailStyles.scss';
import { observer } from 'mobx-react';
import { useNav } from '../../../../utils/navigate';
import messagesDB from '../../../../indexedDB/MessagesDB';
import { blockchainsMap } from '../../../../constants';
import mailList, { ILinkedMessage } from '../../../../stores/MailList';

interface MailboxMailProps {
	message: ILinkedMessage;
}

const MailboxMail: React.FC<MailboxMailProps> = observer(({ message }) => {
	const navigate = useNav();
	const [inUnread, setIsUnread] = useState(true);
	const contact = contacts.contactsByAddress[message.msg.senderAddress];
	const sender = contact ? contact.name : message.msg.senderAddress;
	const checked = mailList.isMessageChecked(message.msgId);
	const decoded = mailList.decodedMessagesById[message.msgId];
	// const isNative: boolean = message.link.userspaceMeta && message.link.userspaceMeta.isNative;

	useEffect(() => {
		(async () => {
			setIsUnread(!(await messagesDB.isMessageRead(message.msgId)));
		})();
	}, [message]);

	const messageClickHandler = async () => {
		if (decoded) {
			navigate(message.msgId);
		} else {
			await mailList.decodeMessage(message);
			navigate(message.msgId);
		}
	};

	const date = (() => {
		const fullDate = new Date(message.msg.createdAt * 1000);

		if (isToday(fullDate)) {
			return fullDate.toLocaleTimeString('en-us', {
				hourCycle: 'h23',
				minute: '2-digit',
				hour: '2-digit',
			});
		}

		return fullDate.toLocaleString('en-us', { day: 'numeric', month: 'short' }).split(' ').reverse().join(' ');
	})();

	const checkHandler = (checked: boolean) => {
		mailList.checkMessage(message, !checked);
	};

	return (
		<tr
			style={{ cursor: 'pointer' }}
			onClick={messageClickHandler}
			className={classNames({
				unread: inUnread,
				read: !inUnread,
			})}
		>
			<td onClick={e => e.stopPropagation()} className="check-mail" style={{ cursor: 'pointer' }}>
				<label className="cont">
					<input type="checkbox" onChange={() => checkHandler(checked)} checked={checked} />
					<span className="checkmark"></span>
				</label>
			</td>
			<td className="mail-contact" style={{ paddingLeft: 20 }}>
				<div>
					{sender.slice(0, 12)}
					{sender.length > 12 && '...'}
				</div>
			</td>
			<td className="mail-subject">
				<span style={!decoded ? { filter: 'blur(5px)' } : {}}>
					{decoded ? decoded.decodedSubject || 'No subject' : 'Message is not decoded'}
				</span>
				{!decoded && <span style={{ marginLeft: 7 }}>[Not decoded]</span>}

				<span
					className="label label-info"
					style={{ float: 'right', fontSize: '80%', background: 'rgb(221, 241, 255)', color: 'black' }}
				>
					{blockchainsMap[message.msg.blockchain].logo(12)} {message.msg.blockchain}
				</span>
			</td>
			<td className="text-right mail-date">{date}</td>
		</tr>
	);
});

export default MailboxMail;
