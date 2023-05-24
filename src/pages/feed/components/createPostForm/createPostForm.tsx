import { asyncDelay } from '@ylide/sdk';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useEffect, useMemo, useState } from 'react';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../components/ActionButton/ActionButton';
import { AutoSizeTextArea } from '../../../../components/autoSizeTextArea/autoSizeTextArea';
import { Spinner } from '../../../../components/spinner/spinner';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as TrashSvg } from '../../../../icons/ic20/trash.svg';
import { ReactComponent as ImageSvg } from '../../../../icons/ic28/image.svg';
import { useVenomAccounts } from '../../../../stores/Domain';
import { OutgoingMailData } from '../../../../stores/outgoingMailData';
import { openFilePicker, readFileAsDataURL } from '../../../../utils/file';
import { SendMailButton } from '../../../mail/components/composeMailForm/sendMailButton/sendMailButton';
import css from './createPostForm.module.scss';

export interface CreatePostFormProps {}

export const CreatePostForm = observer(({}: CreatePostFormProps) => {
	const venomAccounts = useVenomAccounts();

	const mailData = useMemo(() => new OutgoingMailData(), []);

	useEffect(() => {
		mailData.from = venomAccounts[0];
	}, [mailData, venomAccounts]);

	const [expanded, setExpanded] = useState(false);

	const [preview, setPreview] = useState<boolean | string>(false);

	const attachFile = async () => {
		const files = await openFilePicker({ accept: 'image/png, image/jpeg' });
		const file = files[0];
		if (file) {
			setPreview(true);

			function error() {
				setPreview(false);
				mailData.attachments = [];
				toast("Couldn't load the image 😒");
			}

			try {
				const src = await readFileAsDataURL(file);

				await asyncDelay(2000);

				const img = document.createElement('img');

				img.onload = () => {
					setPreview(src);
					mailData.attachments = [file];
				};

				img.onerror = error;

				img.src = src;
			} catch (e) {
				error();
			}
		}
	};

	return (
		<div className={clsx(css.form, expanded && css.form_expanded)}>
			<AutoSizeTextArea
				resetKey={expanded}
				className={css.textarea}
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
					{!!preview && (
						<>
							<div className={css.divider} />

							{preview === true ? (
								<Spinner className={css.previewLoader} />
							) : (
								<img className={css.previewImage} src={preview} />
							)}
						</>
					)}

					<div className={css.divider} />

					<div className={css.footer}>
						{mailData.attachments.length ? (
							<ActionButton
								size={ActionButtonSize.MEDIUM}
								look={ActionButtonLook.DANGEROUS}
								icon={<TrashSvg />}
								title="Remove attachment"
								onClick={() => {
									setPreview(false);
									mailData.attachments = [];
								}}
							>
								Attachment
							</ActionButton>
						) : (
							<ActionButton
								size={ActionButtonSize.MEDIUM}
								look={ActionButtonLook.LITE}
								icon={<ImageSvg />}
								title="Attach image"
								onClick={attachFile}
							/>
						)}

						<SendMailButton mailData={mailData} />
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
