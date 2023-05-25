import { MessageAttachmentLinkV1, YlideIpfsStorage } from '@ylide/sdk';
import React, { useEffect, useRef, useState } from 'react';

import { AdaptiveAddress } from '../../../../components/adaptiveAddress/adaptiveAddress';
import { Avatar } from '../../../../components/avatar/avatar';
import { NlToBr } from '../../../../components/nlToBr/nlToBr';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { ReactComponent as ContactSvg } from '../../../../icons/ic20/contact.svg';
import { MessageDecodedTextDataType } from '../../../../indexedDB/IndexedDB';
import { ILinkedMessage } from '../../../../stores/MailList';
import { uint8ArrayToDataURL } from '../../../../utils/array';
import { decodeMessage } from '../../../../utils/mail';
import css from './venomFeedPostItem.module.scss';

interface VenomFeedPostItemProps {
	message: ILinkedMessage;
}

export function VenomFeedPostItem({ message }: VenomFeedPostItemProps) {
	const selfRef = useRef<HTMLDivElement>(null);

	const [decodedText, setDecodedText] = useState('');
	const [coverImage, setCoverImage] = useState('');

	useEffect(() => {
		decodeMessage(message.msgId, message.msg).then(async ({ decodedTextData, attachments }) => {
			setDecodedText(
				decodedTextData.type === MessageDecodedTextDataType.PLAIN
					? decodedTextData.value
					: decodedTextData.value.toPlainText(),
			);

			const attachment = attachments[0] as MessageAttachmentLinkV1 | undefined;
			if (attachment) {
				const uint8Array = await new YlideIpfsStorage().downloadFromIpfs(
					attachment.link.replace('ipfs://', ''),
				);
				const dataUrl = await uint8ArrayToDataURL(uint8Array);
				setCoverImage(dataUrl);
			}
		});
	}, [message]);

	return (
		<div ref={selfRef} className={css.root}>
			<Avatar className={css.ava} placeholder={<ContactSvg width="100%" height="100%" />} />

			<div className={css.meta}>
				<AdaptiveAddress className={css.sender} address={message.msg.senderAddress} />

				<ReadableDate className={css.date} value={message.msg.createdAt * 1000} />
			</div>

			<div className={css.body}>
				<NlToBr text={decodedText} />

				{coverImage && <img className={css.cover} alt="Attachment" src={coverImage} />}
			</div>
		</div>
	);
}
