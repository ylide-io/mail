import { MessageAttachmentLinkV1 } from '@ylide/sdk';
import React, { useMemo, useRef, useState } from 'react';

import { VenomFilterApi } from '../../../../api/venomFilterApi';
import { ActionButton } from '../../../../components/ActionButton/ActionButton';
import { AdaptiveAddress } from '../../../../components/adaptiveAddress/adaptiveAddress';
import { Avatar } from '../../../../components/avatar/avatar';
import { DropDown, DropDownItem } from '../../../../components/dropDown/dropDown';
import { ErrorMessage, ErrorMessageLook } from '../../../../components/errorMessage/errorMessage';
import { GalleryModal } from '../../../../components/galleryModal/galleryModal';
import { NlToBr } from '../../../../components/nlToBr/nlToBr';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as ExternalSvg } from '../../../../icons/ic20/external.svg';
import { ReactComponent as MenuSvg } from '../../../../icons/ic20/menu.svg';
import { IMessageDecodedContent, MessageDecodedTextDataType } from '../../../../indexedDB/IndexedDB';
import { browserStorage } from '../../../../stores/browserStorage';
import { ILinkedMessage } from '../../../../stores/MailList';
import { HorizontalAlignment } from '../../../../utils/alignment';
import { ipfsToHttpUrl } from '../../../../utils/ipfs';
import css from './venomFeedPostItem.module.scss';

interface VenomFeedPostItemProps {
	message: ILinkedMessage;
	decoded: IMessageDecodedContent;
}

export function VenomFeedPostItem({ message, decoded: { decodedTextData, attachments } }: VenomFeedPostItemProps) {
	const selfRef = useRef<HTMLDivElement>(null);

	const decodedText = useMemo(
		() =>
			decodedTextData.type === MessageDecodedTextDataType.PLAIN
				? decodedTextData.value
				: decodedTextData.value.toPlainText(),
		[decodedTextData],
	);
	const attachment = attachments[0] as MessageAttachmentLinkV1 | undefined;
	const attachmentHttpUrl = attachment && ipfsToHttpUrl(attachment.link);

	const menuButtonRef = useRef(null);
	const [isMenuOpen, setMenuOpen] = useState(false);

	const [isBanned, setBanned] = useState(false);

	const banPost = () => {
		if (confirm('Are you sure?')) {
			VenomFilterApi.banPost({ ids: [message.msgId] })
				.then(() => {
					toast('Banned 🔥');
					setBanned(true);
				})
				.catch(e => {
					toast('Error 🤦‍♀️');
					throw e;
				});
		}
	};

	const unbanPost = () => {
		VenomFilterApi.unbanPost({ ids: [message.msgId] })
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
		<div ref={selfRef} className={css.root}>
			<Avatar className={css.ava} blockie={message.msg.senderAddress} />

			<div className={css.meta}>
				<AdaptiveAddress className={css.sender} maxLength={12} address={message.msg.senderAddress} />

				<div className={css.metaRight}>
					<ReadableDate className={css.date} value={message.msg.createdAt * 1000} />

					{!!message.msg.$$meta.id && (
						<a
							className={css.metaButton}
							href={`https://testnet.venomscan.com/messages/${message.msg.$$meta.id}`}
							target="_blank"
							rel="noreferrer"
							title="Details"
						>
							<ExternalSvg />
						</a>
					)}

					{browserStorage.isUserAdmin && (
						<button ref={menuButtonRef} className={css.metaButton} onClick={() => setMenuOpen(!isMenuOpen)}>
							<MenuSvg />
						</button>
					)}

					{isMenuOpen && (
						<DropDown
							anchorRef={menuButtonRef}
							horizontalAlign={HorizontalAlignment.END}
							onCloseRequest={() => setMenuOpen(false)}
						>
							{isBanned ? (
								<DropDownItem
									onSelect={async () => {
										setMenuOpen(false);
										unbanPost();
									}}
								>
									Unban post
								</DropDownItem>
							) : (
								<DropDownItem
									onSelect={async () => {
										setMenuOpen(false);
										banPost();
									}}
								>
									Ban post
								</DropDownItem>
							)}
						</DropDown>
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
		</div>
	);
}
