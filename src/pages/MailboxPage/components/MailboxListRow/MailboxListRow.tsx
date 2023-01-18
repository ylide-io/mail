import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { CSSProperties, useEffect, useMemo, useState } from 'react';

import { BlockChainLabel } from '../../../../components/BlockChainLabel/BlockChainLabel';
import { ContactName } from '../../../../components/contactName/contactName';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { YlideCheckbox } from '../../../../controls/YlideCheckbox';
import { FilterIcon } from '../../../../icons/FilterIcon';
import domain from '../../../../stores/Domain';
import { ILinkedMessage, useMailStore } from '../../../../stores/MailList';
import { useNav } from '../../../../utils/navigate';
import { safeJson } from '../../../../utils/safeJson';
import css from './MailboxListRow.module.scss';

interface MailboxListRowProps {
	message: ILinkedMessage;
	style: CSSProperties;
	isSelected: boolean;
	onCheckBoxClick: (isSelected: boolean) => void;
	onFilterBySenderClick?: () => void;
}

const MailboxListRow: React.FC<MailboxListRowProps> = observer(
	({ message, style, isSelected, onCheckBoxClick, onFilterBySenderClick }) => {
		const navigate = useNav();
		const [isLoading, setLoading] = useState(false);
		const [error, setError] = useState('');

		const { decodedMessagesById, readMessageIds, decodeMessage } = useMailStore();

		const decoded = decodedMessagesById[message.msgId];
		const isRead = readMessageIds.has(message.id);

		const messageClickHandler = async () => {
			if (decoded) {
				navigate(message.id);
			} else {
				setLoading(true);
				try {
					await decodeMessage(message);
				} catch (err) {
					console.log('decode err: ', err);
					return setError(`Decoding error. Please, double check your Ylide password`);
				} finally {
					setLoading(false);
				}
				navigate(message.id);
			}
		};

		useEffect(() => {
			setError('');
		}, [message.id]);

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
					!isRead && css.root_unread,
					isLoading && css.root_loading,
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
					<YlideCheckbox checked={isSelected} onCheck={value => onCheckBoxClick(value)} />
				</div>

				<div className={css.contact}>
					<ContactName address={message.msg.senderAddress} />

					{onFilterBySenderClick && (
						<div
							className={css.filterBySenderButton}
							title="Show all incoming messages from this sender"
							onClick={e => {
								e.stopPropagation();
								onFilterBySenderClick();
							}}
						>
							<FilterIcon />
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

				<ReadableDate className={css.date} value={message.msg.createdAt * 1000} />
			</div>
		);
	},
);

export default MailboxListRow;
