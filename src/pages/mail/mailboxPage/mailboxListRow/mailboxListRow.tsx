import { YMF } from '@ylide/sdk';
import { Tooltip } from 'antd';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { CSSProperties, useEffect, useMemo, useState } from 'react';
import { generatePath, useParams } from 'react-router-dom';

import { BlockChainLabel } from '../../../../components/BlockChainLabel/BlockChainLabel';
import { CheckBox } from '../../../../components/checkBox/checkBox';
import { ContactName } from '../../../../components/contactName/contactName';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { ReactComponent as FilterSvg } from '../../../../icons/ic20/filter.svg';
import domain from '../../../../stores/Domain';
import { FolderId, ILinkedMessage, mailStore } from '../../../../stores/MailList';
import { RoutePath } from '../../../../stores/routePath';
import { formatAddress } from '../../../../utils/blockchain';
import { decodeEditorData } from '../../../../utils/editorJs';
import { formatSubject } from '../../../../utils/mail';
import { useNav } from '../../../../utils/url';
import css from './mailboxListRow.module.scss';

interface MailboxListRowProps {
	message: ILinkedMessage;
	style: CSSProperties;
	isSelected: boolean;
	onCheckBoxClick: (isSelected: boolean) => void;
	onFilterBySenderClick?: () => void;
}

const MailboxListRow: React.FC<MailboxListRowProps> = observer(
	({ message, style, isSelected, onCheckBoxClick, onFilterBySenderClick }) => {
		const { folderId } = useParams<{ folderId: FolderId }>();
		const navigate = useNav();
		const [isLoading, setLoading] = useState(false);
		const [error, setError] = useState('');

		const decoded = mailStore.decodedMessagesById[message.msgId];
		const isRead = mailStore.readMessageIds.has(message.id);

		const recipients =
			folderId === FolderId.Sent
				? message.recipients.length
					? message.recipients
					: [formatAddress(message.msg.recipientAddress)]
				: [message.msg.senderAddress];

		const messageClickHandler = async () => {
			if (decoded) {
				navigate(
					generatePath(RoutePath.MAIL_DETAILS, { folderId: folderId!, id: encodeURIComponent(message.id) }),
				);
			} else {
				setLoading(true);
				try {
					await mailStore.decodeMessage(message);
				} catch (err) {
					console.log('decode err: ', err);
					return setError(`Decoding error. Please, double check your Ylide password`);
				} finally {
					setLoading(false);
				}
				navigate(generatePath(RoutePath.MAIL_DETAILS, { folderId: folderId!, id: message.id }));
			}
		};

		useEffect(() => {
			setError('');
		}, [message.id]);

		const preview = useMemo(() => {
			if (!decoded) {
				return null;
			}
			if (decoded.decodedTextData?.type === 'YMF') {
				const val = YMF.fromYMFText(decoded.decodedTextData.value).toPlainText();
				console.log('val: ', val);
				return val;
			} else {
				const json = decodeEditorData(decoded?.decodedTextData?.value);
				if (json?.blocks) {
					return json?.blocks.map((b: any) => b.data.text).join('\n');
				} else {
					return (json as any)?.body;
				}
			}
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
				<div className={css.checkbox}>
					<CheckBox isChecked={isSelected} onChange={onCheckBoxClick} />
				</div>

				<div className={css.contact}>
					<ContactName className={css.contactValue} address={recipients[0]} />

					{recipients.length > 1 && (
						<Tooltip
							title={recipients
								.filter((_, i) => i)
								.map(r => (
									<ContactName address={r} noTooltip />
								))}
						>
							<div className={css.contactsNumber}>+{recipients.length - 1}</div>
						</Tooltip>
					)}

					{onFilterBySenderClick && (
						<div
							className={css.filterBySenderButton}
							title="Show all incoming messages from this sender"
							onClick={e => {
								e.stopPropagation();
								onFilterBySenderClick();
							}}
						>
							<FilterSvg />
						</div>
					)}
				</div>

				{decoded ? (
					<>
						<div className={css.subject}>{formatSubject(decoded.decodedSubject)}</div>

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
