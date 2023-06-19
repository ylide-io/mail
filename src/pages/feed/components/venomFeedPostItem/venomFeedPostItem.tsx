import { IMessage, MessageAttachmentLinkV1 } from '@ylide/sdk';
import React, { useMemo, useState } from 'react';

import { VenomFilterApi } from '../../../../api/venomFilterApi';
import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { AdaptiveAddress } from '../../../../components/adaptiveAddress/adaptiveAddress';
import { Avatar } from '../../../../components/avatar/avatar';
import { GridRowBox } from '../../../../components/boxes/boxes';
import { ErrorMessage, ErrorMessageLook } from '../../../../components/errorMessage/errorMessage';
import { GalleryModal } from '../../../../components/galleryModal/galleryModal';
import { NlToBr } from '../../../../components/nlToBr/nlToBr';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { Recipients } from '../../../../components/recipientInput/recipientInput';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as CrossSvg } from '../../../../icons/ic20/cross.svg';
import { ReactComponent as ExternalSvg } from '../../../../icons/ic20/external.svg';
import { ReactComponent as MailSvg } from '../../../../icons/ic20/mail.svg';
import { IMessageDecodedContent, MessageDecodedTextDataType } from '../../../../indexedDB/IndexedDB';
import { browserStorage } from '../../../../stores/browserStorage';
import { useVenomAccounts } from '../../../../stores/Domain';
import { OutgoingMailData } from '../../../../stores/outgoingMailData';
import { copyToClipboard } from '../../../../utils/clipboard';
import { ipfsToHttpUrl } from '../../../../utils/ipfs';
import { useOpenMailCompose } from '../../../../utils/mail';
import { PostItemContainer } from '../postItemContainer/postItemContainer';
import css from './venomFeedPostItem.module.scss';

interface VenomFeedPostItemProps {
	msg: IMessage;
	decoded: IMessageDecodedContent;
}

export function VenomFeedPostItem({ msg, decoded: { decodedTextData, attachments } }: VenomFeedPostItemProps) {
	const decodedText = useMemo(
		() =>
			decodedTextData.type === MessageDecodedTextDataType.PLAIN
				? decodedTextData.value
				: decodedTextData.value.toPlainText(),
		[decodedTextData],
	);
	const attachment = attachments[0] as MessageAttachmentLinkV1 | undefined;
	const attachmentHttpUrl = attachment && ipfsToHttpUrl(attachment.link);

	let [clicks] = useState<number[]>([]);

	const [isBanned, setBanned] = useState(false);

	const openMailCompose = useOpenMailCompose();
	const venomAccounts = useVenomAccounts();

	const banPost = () => {
		VenomFilterApi.banPost({ ids: [msg.msgId], secret: browserStorage.userAdminPassword || '' })
			.then(() => {
				toast('Banned 🔥');
				setBanned(true);
			})
			.catch(e => {
				if (e.message === 'Request failed') {
					toast('Wrong password 🤦‍♀️');
				} else {
					toast('Error 🤦‍♀️');
					throw e;
				}
			});
	};

	const unbanPost = () => {
		VenomFilterApi.unbanPost({ ids: [msg.msgId], secret: browserStorage.userAdminPassword || '' })
			.then(() => {
				toast('Un-banned 🔥');
				setBanned(false);
			})
			.catch(e => {
				toast('Error 🤦‍♀️');
				throw e;
			});
	};

	return (
		<PostItemContainer
			collapsable
			className={css.root}
			onClick={() => {
				clicks = [Date.now(), ...clicks].slice(0, 3);
				if (browserStorage.isUserAdmin && clicks.length === 3 && clicks[0] - clicks[2] < 600) {
					banPost();
				}
			}}
		>
			<Avatar className={css.ava} blockie={msg.senderAddress} />

			<div className={css.meta}>
				<GridRowBox gap={2}>
					<AdaptiveAddress
						className={css.sender}
						maxLength={12}
						address={msg.senderAddress}
						onClick={() => copyToClipboard(msg.senderAddress, { toast: true })}
					/>

					<ActionButton
						className={css.composeButton}
						look={ActionButtonLook.LITE}
						icon={<MailSvg />}
						title="Compose mail"
						onClick={() => {
							const mailData = new OutgoingMailData();
							mailData.from = venomAccounts[0];
							mailData.to = new Recipients([msg.senderAddress]);

							openMailCompose({ mailData });
						}}
					/>
				</GridRowBox>

				<div className={css.metaRight}>
					<ReadableDate className={css.date} value={msg.createdAt * 1000} />

					{!!msg.$$meta.id && (
						<a
							className={css.metaButton}
							href={`https://testnet.venomscan.com/messages/${msg.$$meta.id}`}
							target="_blank"
							rel="noreferrer"
							title="Details"
						>
							<ExternalSvg />
						</a>
					)}

					{browserStorage.isUserAdmin && (
						<button className={css.metaButton} onClick={() => banPost()}>
							<CrossSvg />
						</button>
					)}
				</div>
			</div>

			<div className={css.body}>
				{isBanned ? (
					<ErrorMessage look={ErrorMessageLook.INFO}>
						Post banned 🔥
						<ActionButton onClick={() => unbanPost()}>Undo</ActionButton>
					</ErrorMessage>
				) : (
					<>
						<NlToBr text={decodedText} />

						{attachmentHttpUrl && (
							<img
								className={css.cover}
								alt="Attachment"
								src={attachmentHttpUrl}
								onClick={() => GalleryModal.show([attachmentHttpUrl])}
							/>
						)}
					</>
				)}
			</div>
		</PostItemContainer>
	);
}
