import { MessageAttachmentLinkV1 } from '@ylide/sdk';
import { observer } from 'mobx-react';
import { useMemo } from 'react';

import { DecodedBlockchainFeedPost } from '../../../../api/blockchainFeedApi';
import { AdaptiveAddress } from '../../../../components/adaptiveAddress/adaptiveAddress';
import { GalleryModal } from '../../../../components/galleryModal/galleryModal';
import { TextProcessor } from '../../../../components/textProcessor/textProcessor';
import { MessageDecodedTextDataType } from '../../../../indexedDB/IndexedDB';
import { getIpfsHashFromUrl, ipfsToHttpUrl } from '../../../../utils/ipfs';
import { stickerIpfsIds } from '../createPostForm/stickerIpfsIds';
import css from './repliedDiscussionPost.module.scss';

export interface RepliedDiscussionPostProps {
	post: DecodedBlockchainFeedPost;
}

export const RepliedDiscussionPost = observer(({ post }: RepliedDiscussionPostProps) => {
	const decodedTextData = post.decoded.decodedTextData;
	const decodedText = useMemo(
		() =>
			decodedTextData.type === MessageDecodedTextDataType.PLAIN
				? decodedTextData.value
				: decodedTextData.value.toPlainText(),
		[decodedTextData],
	);

	const attachment = post.decoded.attachments[0] as MessageAttachmentLinkV1 | undefined;
	const attachmentHttpUrl = attachment && ipfsToHttpUrl(attachment.link);
	const attachmentIpfsHash = attachment && getIpfsHashFromUrl(attachment.link);
	const isSticker = !!attachmentIpfsHash && stickerIpfsIds.includes(attachmentIpfsHash);

	return (
		<div className={css.root}>
			<AdaptiveAddress className={css.sender} address={post.msg.senderAddress} maxLength={12} />

			<div className={css.text}>
				<TextProcessor text={decodedText} nlToBr linksToAnchors />
			</div>

			{attachmentHttpUrl && (
				<img
					className={isSticker ? css.sticker : css.cover}
					alt="Attachment"
					src={attachmentHttpUrl}
					onClick={() => {
						if (!isSticker) {
							GalleryModal.show([attachmentHttpUrl]);
						}
					}}
				/>
			)}
		</div>
	);
});
