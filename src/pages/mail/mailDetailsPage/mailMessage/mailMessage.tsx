import { MessageAttachment, MessageAttachmentLinkV1, YlideIpfsStorage } from '@ylide/sdk';
import { observer } from 'mobx-react';
import { useEffect, useMemo, useState } from 'react';
import { createReactEditorJS } from 'react-editor-js';

import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { AdaptiveText } from '../../../../components/adaptiveText/adaptiveText';
import { Avatar } from '../../../../components/avatar/avatar';
import { ContactName } from '../../../../components/contactName/contactName';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { Spinner } from '../../../../components/spinner/spinner';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as AddContactSvg } from '../../../../icons/ic20/addContact.svg';
import { ReactComponent as DownloadSvg } from '../../../../icons/ic20/download.svg';
import { ReactComponent as ForwardSvg } from '../../../../icons/ic20/forward.svg';
import { ReactComponent as ReplySvg } from '../../../../icons/ic20/reply.svg';
import { ReactComponent as TrashSvg } from '../../../../icons/ic20/trash.svg';
import { IContact, IMessageDecodedContent } from '../../../../indexedDB/IndexedDB';
import { analytics } from '../../../../stores/Analytics';
import contacts from '../../../../stores/Contacts';
import domain from '../../../../stores/Domain';
import { FolderId, ILinkedMessage, mailStore } from '../../../../stores/MailList';
import { formatAccountName } from '../../../../utils/account';
import { invariant } from '../../../../utils/assert';
import { formatAddress } from '../../../../utils/blockchain';
import { DateFormatStyle } from '../../../../utils/date';
import { downloadFile, formatFileSize } from '../../../../utils/file';
import { isGlobalMessage } from '../../../../utils/globalFeed';
import { getIpfsHashFromUrl } from '../../../../utils/ipfs';
import {
	decodeAttachment,
	decodedTextDataToEditorJsData,
	EDITOR_JS_TOOLS,
	formatSubject,
	getMessageReceivers,
	getMessageSenders,
} from '../../../../utils/mail';
import { captureSentryExceptionWithId } from '../../../../utils/sentry';
import css from './mailMessage.module.scss';

const ReactEditorJS = createReactEditorJS();

export interface MailMessageProps {
	message: ILinkedMessage;
	decoded?: IMessageDecodedContent;
	folderId?: FolderId;
	onReady?: () => void;
	onReplyClick: () => void;
	onForwardClick: () => void;
	onDeleteClick: () => void;
}

export const MailMessage = observer(
	({ message, decoded, folderId, onReady, onReplyClick, onForwardClick, onDeleteClick }: MailMessageProps) => {
		const editorData = useMemo(() => decoded && decodedTextDataToEditorJsData(decoded.decodedTextData), [decoded]);

		const onDecodeClick = () => {
			mailStore.decodeMessage(message.msgId, message.msg, message.recipient?.account);
		};

		const [isEditorReady, setEditorReady] = useState(!editorData);
		useEffect(() => {
			if (isEditorReady) {
				onReady?.();
			}
		}, [isEditorReady, onReady]);

		const senders = useMemo(() => getMessageSenders(message), [message]);
		const receivers = useMemo(() => getMessageReceivers(message, decoded), [message, decoded]);
		const isGlobal = isGlobalMessage(message.msg);

		function renderRecipients(mode: 'from' | 'to', addresses: string[]) {
			return (
				(!!addresses.length || (mode === 'to' && isGlobal)) && (
					<>
						<div className={css.recipientsLabel}>{mode === 'from' ? 'From:' : 'To:'}</div>

						<div className={css.recipientsList}>
							{mode === 'to' && isGlobal ? (
								<div className={css.recipientsRow}>Everyone</div>
							) : (
								addresses.map(address => {
									const myAccount = domain.accounts.accounts.find(
										a => formatAddress(a.account.address) === formatAddress(address),
									);
									const contact = contacts.find({ address });

									return (
										<div key={address} className={css.recipientsRow}>
											{myAccount ? (
												<AdaptiveText
													text={formatAccountName(myAccount)}
													title={myAccount.account.address}
												/>
											) : (
												<>
													<ContactName address={address} />

													{!contact && (
														<button
															className={css.recipientsButton}
															title="Create contact"
															onClick={() => {
																analytics.startCreatingContact('mail-details');

																const name = prompt('Enter contact name:')?.trim();
																if (!name) return;

																const contact: IContact = {
																	name,
																	description: '',
																	address,
																	tags: [],
																};

																contacts
																	.createContact(contact)
																	.then(() =>
																		analytics.finishCreatingContact('mail-details'),
																	)
																	.catch(() => toast("Couldn't save 😒"));
															}}
														>
															<AddContactSvg />
														</button>
													)}
												</>
											)}
										</div>
									);
								})
							)}
						</div>
					</>
				)
			);
		}

		return (
			<div className={css.root}>
				<Avatar className={css.avatar} blockie={message.msg.senderAddress} />

				<div className={css.title}>{decoded ? formatSubject(decoded.decodedSubject) : '[Encrypted]'}</div>

				<div className={css.actions}>
					{decoded ? (
						<>
							<ActionButton icon={<ReplySvg />} onClick={() => onReplyClick()}>
								Reply
							</ActionButton>

							<ActionButton icon={<ForwardSvg />} title="Forward" onClick={() => onForwardClick()} />

							{folderId !== FolderId.Archive && (
								<ActionButton
									look={ActionButtonLook.DANGEROUS}
									icon={<TrashSvg />}
									title="Archive"
									onClick={() => onDeleteClick()}
								/>
							)}
						</>
					) : (
						<ActionButton onClick={() => onDecodeClick()}>Decode message</ActionButton>
					)}
				</div>

				<div className={css.recipients}>
					{renderRecipients('from', senders)}

					{renderRecipients('to', receivers)}
				</div>

				<ReadableDate className={css.date} style={DateFormatStyle.LONG} value={message.msg.createdAt * 1000} />

				<div className={css.body}>
					{editorData?.blocks && (
						<div className={css.content}>
							<ReactEditorJS
								tools={EDITOR_JS_TOOLS}
								readOnly={true}
								//@ts-ignore
								data={editorData}
								onReady={() => setEditorReady(true)}
							/>
						</div>
					)}

					{!!decoded?.attachments.length && (
						<div className={css.attachments}>
							{decoded.attachments.map(a => (
								<Attachment attachment={a} message={message} />
							))}
						</div>
					)}
				</div>
			</div>
		);
	},
);

//

interface AttachmentProps {
	attachment: MessageAttachment;
	message: ILinkedMessage;
}

export function Attachment({ attachment, message }: AttachmentProps) {
	invariant(attachment instanceof MessageAttachmentLinkV1);

	const [isDownloading, setDownloading] = useState(false);

	const onDownloadClick = async () => {
		try {
			setDownloading(true);

			const uint8Array = await new YlideIpfsStorage().downloadFromIpfs(getIpfsHashFromUrl(attachment.link));
			const decrypted = await decodeAttachment(uint8Array, message.msg, message.recipient!.account);

			downloadFile(decrypted, attachment.fileName);
		} catch (e) {
			captureSentryExceptionWithId('Failed to download attachment', e);
			toast("Couldn't download file 😒");
		} finally {
			setDownloading(false);
		}
	};

	return (
		<div className={css.attachment}>
			<div className={css.attachmentName} title={attachment.fileName}>
				{attachment.fileName}
			</div>
			<div className={css.attachmentSize} title={attachment.fileSize.toString()}>
				{formatFileSize(attachment.fileSize)}
			</div>

			<ActionButton
				className={css.attachmentActions}
				isDisabled={isDownloading}
				look={ActionButtonLook.LITE}
				icon={isDownloading ? <Spinner /> : <DownloadSvg />}
				title="Download"
				onClick={onDownloadClick}
			/>
		</div>
	);
}
