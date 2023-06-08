import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useEffect, useMemo, useState } from 'react';

import { AccountSelect } from '../../../../components/accountSelect/accountSelect';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../components/ActionButton/ActionButton';
import { AutoSizeTextArea } from '../../../../components/autoSizeTextArea/autoSizeTextArea';
import { PropsWithClassName } from '../../../../components/props';
import { Spinner } from '../../../../components/spinner/spinner';
import { toast } from '../../../../components/toast/toast';
import { VENOM_FEED_ID } from '../../../../constants';
import { ReactComponent as TrashSvg } from '../../../../icons/ic20/trash.svg';
import { ReactComponent as ImageSvg } from '../../../../icons/ic28/image.svg';
import { DomainAccount } from '../../../../stores/models/DomainAccount';
import { OutgoingMailData, OutgoingMailDataMode } from '../../../../stores/outgoingMailData';
import { openFilePicker, readFileAsDataURL } from '../../../../utils/file';
import { SendMailButton } from '../../../mail/components/composeMailForm/sendMailButton/sendMailButton';
import css from './createPostForm.module.scss';

export interface CreatePostFormProps extends PropsWithClassName {
	accounts: DomainAccount[];
	onCreated?: () => void;
}

export const CreatePostForm = observer(({ className, accounts, onCreated }: CreatePostFormProps) => {
	const mailData = useMemo(() => {
		const mailData = new OutgoingMailData();

		mailData.mode = OutgoingMailDataMode.BROADCAST;
		mailData.feedId = VENOM_FEED_ID;

		mailData.validator = () => {
			if (mailData.plainTextData.length > 4096) {
				toast('Text is too long 👀');
				return false;
			}

			if (mailData.plainTextData.split('\n').length > 128) {
				toast('Too many line breaks 👀');
				return false;
			}

			return true;
		};

		return mailData;
	}, []);

	useEffect(() => {
		mailData.from = mailData.from && accounts.includes(mailData.from) ? mailData.from : accounts[0];
	}, [mailData, accounts]);

	const [expanded, setExpanded] = useState(false);

	const [preview, setPreview] = useState('');
	const [previewLoading, setPreviewLoading] = useState(false);

	const attachFile = async () => {
		const files = await openFilePicker({ accept: 'image/png, image/jpeg' });
		const file = files[0];
		if (file) {
			setPreview('');
			setPreviewLoading(true);

			function success(src: string) {
				setPreview(src);
				setPreviewLoading(false);
				mailData.attachments = [file];
			}

			function error() {
				setPreviewLoading(false);
				mailData.attachments = [];
				toast("Couldn't load the image 😒");
			}

			try {
				const src = await readFileAsDataURL(file);
				const img = document.createElement('img');
				img.onload = () => success(src);
				img.onerror = error;
				img.src = src;
			} catch (e) {
				error();
			}
		}
	};

	const onSent = () => {
		mailData.reset({
			mode: OutgoingMailDataMode.BROADCAST,
			feedId: VENOM_FEED_ID,
			from: mailData.from,
		});

		setPreview('');
		setExpanded(false);

		onCreated?.();
	};

	return (
		<div className={clsx(css.form, expanded && css.form_expanded, className)}>
			<AutoSizeTextArea
				resetKey={expanded}
				className={css.textarea}
				disabled={mailData.sending}
				placeholder="Make a new post"
				maxHeight={400}
				rows={expanded ? 4 : 1}
				value={mailData.plainTextData}
				onChangeValue={value => {
					mailData.plainTextData = value;
				}}
				onFocus={() => setExpanded(true)}
			/>

			{expanded ? (
				<>
					{(!!preview || previewLoading) && (
						<>
							<div className={css.divider} />

							{previewLoading ? (
								<Spinner className={css.previewLoader} />
							) : (
								<img className={css.previewImage} alt="Preview" src={preview} />
							)}
						</>
					)}

					<div className={css.divider} />

					<div className={css.footer}>
						<AccountSelect
							className={css.accontSelect}
							accounts={accounts}
							activeAccount={mailData.from}
							onChange={account => (mailData.from = account)}
						/>

						<div className={css.footerRight}>
							{mailData.attachments.length ? (
								<ActionButton
									isDisabled={mailData.sending}
									size={ActionButtonSize.MEDIUM}
									look={ActionButtonLook.DANGEROUS}
									icon={<TrashSvg />}
									title="Remove attachment"
									onClick={() => {
										setPreview('');
										mailData.attachments = [];
									}}
								>
									Attachment
								</ActionButton>
							) : (
								<ActionButton
									isDisabled={previewLoading || mailData.sending}
									size={ActionButtonSize.MEDIUM}
									look={ActionButtonLook.LITE}
									icon={<ImageSvg />}
									title="Attach image"
									onClick={attachFile}
								/>
							)}

							<SendMailButton disabled={previewLoading} mailData={mailData} onSent={onSent} />
						</div>
					</div>
				</>
			) : (
				<ActionButton isDisabled size={ActionButtonSize.MEDIUM} look={ActionButtonLook.SECONDARY}>
					Post
				</ActionButton>
			)}
		</div>
	);
});
