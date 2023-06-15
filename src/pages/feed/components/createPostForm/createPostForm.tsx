import { MessageAttachmentLinkV1, MessageAttachmentType } from '@ylide/sdk';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from 'react-query';

import { VenomFilterApi } from '../../../../api/venomFilterApi';
import { AccountSelect } from '../../../../components/accountSelect/accountSelect';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../components/ActionButton/ActionButton';
import { AutoSizeTextArea } from '../../../../components/autoSizeTextArea/autoSizeTextArea';
import { GridRowBox } from '../../../../components/boxes/boxes';
import { GalleryModal } from '../../../../components/galleryModal/galleryModal';
import { AnchoredPopup } from '../../../../components/popup/anchoredPopup/anchoredPopup';
import { PropsWithClassName } from '../../../../components/props';
import { toast } from '../../../../components/toast/toast';
import { VENOM_FEED_ID } from '../../../../constants';
import { ReactComponent as TrashSvg } from '../../../../icons/ic20/trash.svg';
import { ReactComponent as BulbSvg } from '../../../../icons/ic28/bulb.svg';
import { ReactComponent as StickerSvg } from '../../../../icons/ic28/sticker.svg';
import { DomainAccount } from '../../../../stores/models/DomainAccount';
import { OutgoingMailData, OutgoingMailDataMode } from '../../../../stores/outgoingMailData';
import { HorizontalAlignment } from '../../../../utils/alignment';
import { hashToIpfsUrl, ipfsToHttpUrl } from '../../../../utils/ipfs';
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

	const { mutate: loadIdea, isLoading: isIdeaLoading } = useMutation({
		mutationFn: () => VenomFilterApi.getTextIdea(),
		onSuccess: data => {
			mailData.plainTextData = [mailData.plainTextData, data].filter(Boolean).join('\n\n');
		},
		onError: () => toast('Failed to get idea 🤦‍♀️'),
	});

	const stickerButtonRef = useRef(null);
	const [isStickerPopupOpen, setStickerPopupOpen] = useState(false);

	const attachmentUrl = mailData.attachments.length
		? ipfsToHttpUrl((mailData.attachments[0] as MessageAttachmentLinkV1).link)
		: undefined;

	const onSent = () => {
		mailData.reset({
			mode: OutgoingMailDataMode.BROADCAST,
			feedId: VENOM_FEED_ID,
			from: mailData.from,
		});

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
					{attachmentUrl && (
						<>
							<div className={css.divider} />

							<div className={css.preview}>
								<img
									className={css.previewImage}
									alt="Preview"
									src={attachmentUrl}
									onClick={() => GalleryModal.show([attachmentUrl])}
								/>

								<ActionButton
									className={css.removeImageButton}
									isDisabled={mailData.sending}
									look={ActionButtonLook.DANGEROUS}
									icon={<TrashSvg />}
									onClick={() => (mailData.attachments = [])}
								>
									Remove
								</ActionButton>
							</div>
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
							<GridRowBox gap={4}>
								<ActionButton
									isDisabled={mailData.sending || isIdeaLoading}
									size={ActionButtonSize.MEDIUM}
									look={ActionButtonLook.LITE}
									icon={<BulbSvg />}
									title="Get idea!"
									onClick={() => loadIdea()}
								/>

								<ActionButton
									ref={stickerButtonRef}
									isDisabled={mailData.sending}
									size={ActionButtonSize.MEDIUM}
									look={ActionButtonLook.LITE}
									icon={<StickerSvg />}
									title="Stickers"
									onClick={() => setStickerPopupOpen(!isStickerPopupOpen)}
								/>

								{isStickerPopupOpen && (
									<AnchoredPopup
										className={css.stickerPopup}
										anchorRef={stickerButtonRef}
										horizontalAlign={HorizontalAlignment.END}
										alignerOptions={{
											fitLeftToViewport: true,
										}}
										onCloseRequest={() => setStickerPopupOpen(false)}
									>
										<div className={css.stickerPopupContent}>
											{stickerIpfsIds.map((id, i) => (
												<img
													key={i}
													alt="Sticker"
													src={ipfsToHttpUrl(id)}
													onClick={() => {
														setStickerPopupOpen(false);
														mailData.attachments = [
															new MessageAttachmentLinkV1({
																type: MessageAttachmentType.LINK_V1,
																previewLink: '',
																link: hashToIpfsUrl(id),
																fileName: 'Venom sticker',
																fileSize: 0,
																isEncrypted: false,
															}),
														];
													}}
												/>
											))}
										</div>
									</AnchoredPopup>
								)}
							</GridRowBox>

							<SendMailButton disabled={isIdeaLoading} mailData={mailData} onSent={onSent} />
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

//

const stickerIpfsIds = [
	'QmeXyjgDKFYTjnHZ3Aw3pmsYZmBBXwR7GmnooKJruCXPBb',
	'QmcoCy3NRmLUrKqVwK3b4AxM4ZuuwCADECQ3t52wHj65rV',
	'QmSVgrVnbX91n2VEEEgHdaGVCnGokNnoLmnXUiDuFyiUy1',
	'QmbTfqQgspytbRPcL2KD7JK7JJkm6Up6hGhBsk96FrrsJy',
	'QmYj9HrD21KYkomc4MDEEAMzsYbEHNT1TyertEri79QeLP',
];

stickerIpfsIds.push(...stickerIpfsIds);
stickerIpfsIds.push(...stickerIpfsIds);
stickerIpfsIds.push(...stickerIpfsIds);
