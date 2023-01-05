import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { CSSProperties, useEffect, useMemo, useState } from 'react';

import { BlockChainLabel } from '../../../../components/BlockChainLabel/BlockChainLabel';
import { AdaptiveAddress } from '../../../../controls/AdaptiveAddress';
import { YlideCheckbox } from '../../../../controls/YlideCheckbox';
import contacts from '../../../../stores/Contacts';
import domain from '../../../../stores/Domain';
import mailList, { ILinkedMessage } from '../../../../stores/MailList';
import { isToday } from '../../../../utils/date';
import { useNav } from '../../../../utils/navigate';
import { safeJson } from '../../../../utils/safeJson';
import css from './MailboxListRow.module.scss';

interface MailboxListRowProps {
	message: ILinkedMessage;
	style: CSSProperties;
	onFilterBySenderClick?: (senderAddress: string) => void;
}

const MailboxListRow: React.FC<MailboxListRowProps> = observer(({ message, style, onFilterBySenderClick }) => {
	const navigate = useNav();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const contact = contacts.contactsByAddress[message.msg.senderAddress];
	const checked = mailList.isMessageChecked(message.id);
	const decoded = mailList.decodedMessagesById[message.msgId];
	const isUnread = !mailList.readMessageIds.has(message.id);

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

	const date = useMemo(() => {
		const fullDate = new Date(message.msg.createdAt * 1000);

		if (isToday(fullDate)) {
			return fullDate.toLocaleTimeString('en-us', {
				hourCycle: 'h23',
				minute: '2-digit',
				hour: '2-digit',
			});
		}

		return fullDate.toLocaleString('en-us', { day: 'numeric', month: 'short' }).split(' ').reverse().join(' ');
	}, [message.msg.createdAt]);

	const preview = useMemo(() => {
		return (
			decoded &&
			safeJson(decoded.decodedTextData, null)
				?.blocks.map((b: any) => b.data.text)
				.join('\n')
		);
	}, [decoded]);

	return (
		<div
			className={clsx(
				css.root,
				isUnread && css.root_unread,
				loading && css.root_loading,
				!!error && css.root_error,
			)}
			style={style}
			onClick={messageClickHandler}
			title={
				domain.devMode
					? `${message.msgId.substring(0, 4)}..${message.msgId.substring(message.msgId.length - 4)}`
					: undefined
			}
		>
			<div className={css.checkbox} onClick={e => e.stopPropagation()}>
				<YlideCheckbox checked={checked} onCheck={val => mailList.checkMessage(message, val)} />
			</div>

			<div className={css.contact}>
				{contact ? contact.name : <AdaptiveAddress address={message.msg.senderAddress} />}

				{onFilterBySenderClick && (
					<div
						className={css.filterBySenderButton}
						title="Show all incoming messages from this sender"
						onClick={e => {
							e.stopPropagation();
							onFilterBySenderClick(message.msg.senderAddress);
						}}
					>
						<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
							<path d="M12.6816 1.80005H3.32162C1.96162 1.80005 1.20162 3.40005 2.12162 4.44005L5.20162 8.04005C5.45526 8.32759 5.59721 8.69665 5.60162 9.08005V11.8C5.60162 12.0122 5.68591 12.2157 5.83594 12.3657C5.98597 12.5158 6.18945 12.6 6.40162 12.6C6.6138 12.6 6.81728 12.5158 6.96731 12.3657C7.11734 12.2157 7.20162 12.0122 7.20162 11.8V9.08005C7.20011 8.31903 6.93109 7.58277 6.44162 7.00005L3.36002 3.40005H12.68L9.60002 7.00005C9.11662 7.58626 8.84843 8.32028 8.84002 9.08005V13.4C8.84002 13.6122 8.92431 13.8157 9.07434 13.9657C9.22437 14.1158 9.42785 14.2 9.64002 14.2C9.8522 14.2 10.0557 14.1158 10.2057 13.9657C10.3557 13.8157 10.44 13.6122 10.44 13.4V9.08005C10.4329 8.88866 10.4647 8.69783 10.5335 8.51907C10.6022 8.34032 10.7065 8.17736 10.84 8.04005L13.92 4.44005C14.7616 3.40005 14.0416 1.80005 12.6816 1.80005Z" />
						</svg>
					</div>
				)}
			</div>

			{decoded ? (
				<>
					<div className={css.subject}>{decoded.decodedSubject || '(no subject)'}</div>

					{!!preview && <div className={css.preview}>{preview}</div>}
				</>
			) : error ? (
				<div className={css.error}>{error}</div>
			) : (
				<div className={css.encrypted}>[Encrypted]</div>
			)}

			<div className={css.blockchain}>
				<BlockChainLabel blockchain={message.msg.blockchain} />
			</div>

			<div className={css.date}>{date}</div>
		</div>
	);
});

export default MailboxListRow;
