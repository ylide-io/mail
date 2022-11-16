import React, { CSSProperties, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';

import contacts from '../../../stores/Contacts';
import { isToday } from '../../../utils/date';
import { useNav } from '../../../utils/navigate';
import { blockchainsMap } from '../../../constants';
import mailList, { ILinkedMessage } from '../../../stores/MailList';
import { YlideCheckbox } from '../../../controls/YlideCheckbox';
import domain from '../../../stores/Domain';
import { AdaptiveAddress } from '../../../controls/AdaptiveAddress';
import { safeJson } from '../../../utils/safeJson';

interface MailboxListRowProps {
	message: ILinkedMessage;
	style: CSSProperties;
	isHighRow: boolean;
}

const MailboxListRow: React.FC<MailboxListRowProps> = observer(({ style, message, isHighRow }) => {
	const navigate = useNav();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const contact = contacts.contactsByAddress[message.msg.senderAddress];
	const checked = mailList.isMessageChecked(message.id);
	const decoded = mailList.decodedMessagesById[message.msgId];
	const isUnread = !mailList.readMessageIds.has(message.id);
	// const isNative: boolean = message.link.userspaceMeta && message.link.userspaceMeta.isNative;

	const messageClickHandler = async () => {
		if (decoded) {
			navigate(message.id);
		} else {
			setLoading(true);
			try {
				await mailList.decodeMessage(message);
			} catch (err) {
				console.log('decode err: ', err);
				setError(`Decoding error. Please, double check your Ylide password`);
				return;
			} finally {
				setLoading(false);
			}
			navigate(message.id);
		}
	};

	useEffect(() => {
		setError('');
	}, [message.id]);

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
				loading,
				error: !!error,
				isHighRow,
			})}
		>
			<div onClick={e => e.stopPropagation()} className="check-mail" style={{ cursor: 'pointer' }}>
				<YlideCheckbox checked={checked} onCheck={val => mailList.checkMessage(message, val)} />
			</div>
			{isHighRow ? (
				<div className="mailbox-list-highrow">
					<div className="mlhr-header">
						<div className="mail-contact">
							<div className="mail-contact-inner">
								{contact ? contact.name : <AdaptiveAddress address={message.msg.senderAddress} />}
							</div>
						</div>
						<div className="text-right mail-date">{date}</div>
					</div>
					<div className="mail-row-content">
						<div className="mail-row-inner-content">
							{decoded ? (
								<>
									<div className="mail-subject">
										<span className="mail-subject-inner">
											<span className="mail-subject-title">
												{decoded.decodedSubject || 'No subject'}
											</span>
										</span>
									</div>
									<div className="mail-preview">
										{safeJson(decoded.decodedTextData, null)
											?.blocks.map((b: any) => b.data.text)
											.join('\n') ||
											[] ||
											'No preview'}
									</div>
								</>
							) : (
								<div className="decode-button">Not decoded</div>
							)}
						</div>
						<span className="label mail-label">
							<span className="mail-label-icon">{blockchainsMap[message.msg.blockchain].logo(12)}</span>
							<span className="mail-label-title">{message.msg.blockchain.toUpperCase()}</span>
						</span>
					</div>
				</div>
			) : (
				<>
					<div className="mail-contact">
						{contact ? contact.name : <AdaptiveAddress address={message.msg.senderAddress} />}
					</div>
					{domain.devMode ? (
						<div className="mail-id">
							{message.msgId.substring(0, 4)}...{message.msgId.substring(message.msgId.length - 4)}
						</div>
					) : null}
					<div className="mail-subject">
						<span className="mail-subject-inner">
							<span className="mail-subject-title" style={!decoded ? { filter: 'blur(5px)' } : {}}>
								{decoded ? decoded.decodedSubject || 'No subject' : 'Message is not decoded'}
							</span>
							{!decoded &&
								(error ? (
									<span style={{ marginLeft: 7, color: 'red' }}>{error}</span>
								) : (
									<span style={{ marginLeft: 7 }}>[Not decoded]</span>
								))}
						</span>

						<span className="label mail-label">
							<span className="mail-label-icon">{blockchainsMap[message.msg.blockchain].logo(12)}</span>
							<span className="mail-label-title">{message.msg.blockchain.toUpperCase()}</span>
						</span>
					</div>
					<div className="text-right mail-date">{date}</div>
				</>
			)}
		</div>
	);
});

export default MailboxListRow;
