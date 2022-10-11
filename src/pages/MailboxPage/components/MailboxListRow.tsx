import React, { CSSProperties } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';

import contacts from '../../../stores/Contacts';
import { isToday } from '../../../utils/date';
import { useNav } from '../../../utils/navigate';
import { blockchainsMap } from '../../../constants';
import mailList, { ILinkedMessage } from '../../../stores/MailList';
import { YlideCheckbox } from '../../../controls/YlideCheckbox';
import domain from '../../../stores/Domain';

interface MailboxListRowProps {
	message: ILinkedMessage;
	style: CSSProperties;
}

const MailboxListRow: React.FC<MailboxListRowProps> = observer(({ style, message }) => {
	const navigate = useNav();
	const contact = contacts.contactsByAddress[message.msg.senderAddress];
	const sender = contact ? contact.name : message.msg.senderAddress;
	const checked = mailList.isMessageChecked(message.id);
	const decoded = mailList.decodedMessagesById[message.msgId];
	const isUnread = !mailList.readMessageIds.has(message.id);
	// const isNative: boolean = message.link.userspaceMeta && message.link.userspaceMeta.isNative;

	const messageClickHandler = async () => {
		if (decoded) {
			navigate(message.id);
		} else {
			await mailList.decodeMessage(message);
			navigate(message.id);
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

	return (
		<div
			style={style}
			onClick={messageClickHandler}
			className={classNames('mailbox-list-row', {
				unread: isUnread,
				read: !isUnread,
			})}
		>
			<div onClick={e => e.stopPropagation()} className="check-mail" style={{ cursor: 'pointer' }}>
				<YlideCheckbox
					checked={checked}
					onCheck={val => {
						console.log('new val: ', val);
						mailList.checkMessage(message, val);
					}}
				/>
			</div>
			<div className="mail-contact">
				{sender.slice(0, 12)}
				{sender.length > 12 && '...'}
			</div>
			{domain.devMode ? (
				<div className="mail-id">
					{message.msgId.substring(0, 4)}...{message.msgId.substring(message.msgId.length - 4)}
				</div>
			) : null}
			<div className="mail-subject">
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
			</div>
			<div className="text-right mail-date">{date}</div>
		</div>
	);
});

export default MailboxListRow;
