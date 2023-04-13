import { YMF } from '@ylide/sdk';
import { Tooltip } from 'antd';
import { observer } from 'mobx-react';
import React, { useEffect, useMemo, useState } from 'react';
import { createReactEditorJS } from 'react-editor-js';

import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { Blockie } from '../../../../components/blockie/blockie';
import { ContactName } from '../../../../components/contactName/contactName';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { useToastManager } from '../../../../components/toast/toast';
import { ReactComponent as AddContactSvg } from '../../../../icons/ic20/addContact.svg';
import { ReactComponent as ForwardSvg } from '../../../../icons/ic20/forward.svg';
import { ReactComponent as ReplySvg } from '../../../../icons/ic20/reply.svg';
import { ReactComponent as TrashSvg } from '../../../../icons/ic20/trash.svg';
import { IMessageDecodedSerializedContent } from '../../../../indexedDB/MessagesDB';
import contacts from '../../../../stores/Contacts';
import { FolderId, ILinkedMessage, mailStore } from '../../../../stores/MailList';
import { IContact } from '../../../../stores/models/IContact';
import { formatAddress } from '../../../../utils/blockchain';
import { DateFormatStyle } from '../../../../utils/date';
import { decodeEditorData, EDITOR_JS_TOOLS } from '../../../../utils/editorJs';
import { ymfToEditorJs } from '../../../../utils/editorjsJson';
import { formatSubject } from '../../../../utils/mail';
import css from './mailMessage.module.scss';

const ReactEditorJS = createReactEditorJS();

export interface MailMessageProps {
	message: ILinkedMessage;
	decoded?: IMessageDecodedSerializedContent;
	folderId?: FolderId;
	onReady?: () => void;
	onReplyClick: () => void;
	onForwardClick: () => void;
	onDeleteClick: () => void;
}

export const MailMessage = observer(
	({ message, decoded, folderId, onReady, onReplyClick, onForwardClick, onDeleteClick }: MailMessageProps) => {
		const { toast } = useToastManager();
		console.log(message);
		const editorData = useMemo(() => {
			if (!decoded?.decodedTextData) return null;
			if (decoded.decodedTextData.type === 'plain') {
				const json = decodeEditorData(decoded.decodedTextData.value);
				const isQamonMessage = !json?.blocks;
				return isQamonMessage
					? {
							time: 1676587472156,
							blocks: [{ id: '2cC8_Z_Rad', type: 'paragraph', data: { text: (json as any).body } }],
							version: '2.26.5',
					  }
					: json;
			} else {
				return ymfToEditorJs(YMF.fromYMFText(decoded.decodedTextData.value));
			}
		}, [decoded?.decodedTextData]);

		const onDecodeClick = () => {
			mailStore.decodeMessage(message);
		};

		const [isEditorReady, setEditorReady] = useState(!editorData);
		useEffect(() => {
			if (isEditorReady) {
				onReady?.();
			}
		}, [isEditorReady, onReady]);

		return (
			<div className={css.root}>
				<Blockie className={css.avatar} address={message.msg.senderAddress} />

				<div className={css.title}>{decoded ? formatSubject(decoded.decodedSubject) : '[Encrypted]'}</div>

				<div className={css.actions}>
					{decoded ? (
						<>
							<ActionButton icon={<ReplySvg />} onClick={() => onReplyClick()}>
								Reply
							</ActionButton>

							<Tooltip title="Forward">
								<ActionButton icon={<ForwardSvg />} onClick={() => onForwardClick()} />
							</Tooltip>

							{folderId !== FolderId.Archive && (
								<Tooltip title="Archive">
									<ActionButton
										look={ActionButtonLook.DANGEROUS}
										icon={<TrashSvg />}
										onClick={() => onDeleteClick()}
									/>
								</Tooltip>
							)}
						</>
					) : (
						<ActionButton onClick={() => onDecodeClick()}>Decode message</ActionButton>
					)}
				</div>

				<div className={css.sender}>
					<div className={css.senderLabel}>
						{folderId === FolderId.Sent
							? message.recipients.length > 1
								? 'Receivers'
								: 'Receiver'
							: 'Sender'}
						:
					</div>

					<div className={css.senderList}>
						{(folderId === FolderId.Sent
							? message.recipients.length
								? message.recipients
								: [formatAddress(message.msg.recipientAddress)]
							: [message.msg.senderAddress]
						).map(address => {
							const contact = contacts.find({ address });

							return (
								<div className={css.senderRow}>
									<ContactName address={address} />

									{!contact && (
										<ActionButton
											className={css.addContactButton}
											icon={<AddContactSvg />}
											title="Create contact"
											onClick={() => {
												const name = prompt('Enter contact name:')?.trim();
												if (!name) return;

												const contact: IContact = {
													name,
													description: '',
													address,
													tags: [],
												};

												contacts.createContact(contact).catch(() => toast("Couldn't save 😒"));
											}}
										/>
									)}
								</div>
							);
						})}
					</div>
				</div>

				<ReadableDate className={css.date} style={DateFormatStyle.LONG} value={message.msg.createdAt * 1000} />

				{editorData?.blocks && (
					<div className={css.body}>
						<ReactEditorJS
							tools={EDITOR_JS_TOOLS}
							readOnly={true}
							//@ts-ignore
							data={editorData}
							onReady={() => setEditorReady(true)}
						/>
					</div>
				)}
			</div>
		);
	},
);
