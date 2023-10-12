import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AccountSelect } from '../../../../components/accountSelect/accountSelect';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../components/ActionButton/ActionButton';
import { DropDown } from '../../../../components/dropDown/dropDown';
import { PropsWithClassName } from '../../../../components/props';
import { RecipientInput } from '../../../../components/recipientInput/recipientInput';
import { TextField } from '../../../../components/textField/textField';
import { ReactComponent as TrashSvg } from '../../../../icons/ic20/trash.svg';
import { ReactComponent as AttachmentSvg } from '../../../../icons/ic28/attachment.svg';
import domain from '../../../../stores/Domain';
import { OutgoingMailData } from '../../../../stores/outgoingMailData';
import { AlignmentDirection } from '../../../../utils/alignment';
import { formatFileSize, openFilePicker, readFileAsText } from '../../../../utils/file';
import { formatSubject } from '../../../../utils/mail';
import { MailboxEditor, MailboxEditorApi } from '../../composePage/mailboxEditor/mailboxEditor';
import css from './composeMailForm.module.scss';
import { SendMailButton } from './sendMailButton/sendMailButton';

export interface ComposeMailFormProps extends PropsWithClassName {
	isRecipientInputDisabled?: boolean;
	displayConnectAccountButton?: boolean;
	mailData: OutgoingMailData;
	onSent?: () => void;
}

export const ComposeMailForm = observer(
	({ className, isRecipientInputDisabled, displayConnectAccountButton, mailData, onSent }: ComposeMailFormProps) => {
		const [searchParams] = useSearchParams();
		const enableCsv = searchParams.has('csv');

		const editorRef = useRef<MailboxEditorApi>(null);

		const attachButtonRef = useRef(null);
		const [isAttachmentPopupOpen, setAttachmentPopupOpen] = useState(false);

		async function attachFile() {
			const files = await openFilePicker({ multiple: true });
			if (files.length) {
				mailData.attachmentFiles.push(...files);
			}
		}

		function removeAttachment(file: File) {
			mailData.attachmentFiles = mailData.attachmentFiles.filter(it => it !== file);
		}

		return (
			<div className={clsx(css.root, className)}>
				<div className={css.meta}>
					{domain.accounts.hasActiveAccounts && (
						<>
							<div className={css.metaLabel}>From</div>
							<AccountSelect
								activeAccount={mailData.from}
								displayConnectButton={displayConnectAccountButton}
								onChange={account => (mailData.from = account)}
							/>
						</>
					)}

					<div className={css.metaLabel}>To</div>
					<div className={css.recipientWrapper}>
						<RecipientInput isReadOnly={isRecipientInputDisabled} value={mailData.to} />

						{enableCsv && (
							<ActionButton
								size={ActionButtonSize.SMALL}
								look={ActionButtonLook.LITE}
								icon={<AttachmentSvg />}
								onClick={async () => {
									const files = await openFilePicker({ accept: '.txt, .csv' });
									const file = files[0];
									if (file) {
										const rawCsv = await readFileAsText(file);
										const addresses = rawCsv
											.split('\n')
											.map(l => l.trim().toLowerCase())
											.filter(Boolean);

										mailData.to.addItems(addresses);
									}
								}}
							>
								CSV
							</ActionButton>
						)}
					</div>

					<div className={css.metaLabel}>Subject</div>
					<TextField
						placeholder={formatSubject('')}
						value={mailData.subject}
						onValueChange={value => (mailData.subject = value)}
						onEnter={() => editorRef.current?.focus()}
					/>
				</div>

				<div className={css.content}>
					<MailboxEditor ref={editorRef} mailData={mailData} />
				</div>

				<div className={css.footer}>
					<ActionButton
						size={ActionButtonSize.MEDIUM}
						look={ActionButtonLook.LITE}
						icon={<AttachmentSvg />}
						title="Attach a file"
						onClick={() => attachFile()}
					/>

					{!!mailData.attachmentFiles.length && (
						<>
							<ActionButton
								ref={attachButtonRef}
								size={ActionButtonSize.SMALL}
								look={ActionButtonLook.LITE}
								onClick={() => setAttachmentPopupOpen(!isAttachmentPopupOpen)}
							>
								{mailData.attachmentFiles.length === 1
									? '1 file'
									: `${mailData.attachmentFiles.length} files`}{' '}
								attached
							</ActionButton>

							{isAttachmentPopupOpen && (
								<DropDown
									anchorRef={attachButtonRef}
									alignmentDirection={AlignmentDirection.TOP}
									onCloseRequest={() => setAttachmentPopupOpen(false)}
								>
									{mailData.attachmentFiles.map(file => (
										<div className={css.attachment}>
											<div className={css.attachmentName}>{file.name}</div>
											<div className={css.attachmentSize}>{formatFileSize(file.size)}</div>
											<ActionButton
												className={css.attachmentActions}
												look={ActionButtonLook.DANGEROUS}
												icon={<TrashSvg />}
												title="Remove"
												onClick={() => {
													removeAttachment(file);

													if (!mailData.attachmentFiles.length) {
														setAttachmentPopupOpen(false);
													}
												}}
											/>
										</div>
									))}
								</DropDown>
							)}
						</>
					)}

					<SendMailButton className={css.sendButton} mailData={mailData} onSent={onSent} />
				</div>
			</div>
		);
	},
);
