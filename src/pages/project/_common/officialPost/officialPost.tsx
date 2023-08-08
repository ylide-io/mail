import { MessageAttachmentLinkV1 } from '@ylide/sdk';
import clsx from 'clsx';
import { useCallback, useMemo, useRef, useState } from 'react';
import { generatePath } from 'react-router-dom';

import { BlockchainFeedApi, DecodedBlockchainFeedPost } from '../../../../api/blockchainFeedApi';
import { ActionButton } from '../../../../components/ActionButton/ActionButton';
import { ProjectAvatar } from '../../../../components/avatar/avatar';
import { GridRowBox } from '../../../../components/boxes/boxes';
import { ErrorMessage, ErrorMessageLook } from '../../../../components/errorMessage/errorMessage';
import { GalleryModal } from '../../../../components/galleryModal/galleryModal';
import { NlToBr } from '../../../../components/nlToBr/nlToBr';
import { PostItemContainer } from '../../../../components/postItemContainer/postItemContainer';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as CrossSvg } from '../../../../icons/ic20/cross.svg';
import { MessageDecodedTextDataType } from '../../../../indexedDB/IndexedDB';
import { BlockchainProject, BlockchainProjectId } from '../../../../stores/blockchainProjects/blockchainProjects';
import { browserStorage } from '../../../../stores/browserStorage';
import { RoutePath } from '../../../../stores/routePath';
import { getIpfsHashFromUrl, ipfsToHttpUrl } from '../../../../utils/ipfs';
import { useNav } from '../../../../utils/url';
import { stickerIpfsIds } from '../createPostForm/stickerIpfsIds';
import css from './officialPost.module.scss';

export function generateOfficialPostPath(projectId: BlockchainProjectId, postId: string) {
	return generatePath(RoutePath.PROJECT_POST, { projectId, postId: encodeURIComponent(postId) });
}

interface OfficialPostViewProps {
	project: BlockchainProject;
	post: DecodedBlockchainFeedPost;
}

export function OfficialPostView({ project, post }: OfficialPostViewProps) {
	const navigate = useNav();
	const isAdminMode = browserStorage.isUserAdmin;

	const postUrl = generateOfficialPostPath(project.id, post.original.id);

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

	//

	const [isBanned, setBanned] = useState(false);

	const banPost = useCallback(() => {
		BlockchainFeedApi.banPost({ ids: [post.msg.msgId], secret: browserStorage.adminPassword || '' })
			.then(() => {
				toast('Removed 👌');
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
	}, [post.msg.msgId]);

	const unbanPost = useCallback(() => {
		BlockchainFeedApi.unbanPost({ ids: [post.msg.msgId], secret: browserStorage.adminPassword || '' })
			.then(() => {
				toast('Restored 🔥');
				setBanned(false);
			})
			.catch(e => {
				toast('Error 🤦‍♀️');
				throw e;
			});
	}, [post.msg.msgId]);

	//

	return (
		<PostItemContainer isCollapsable className={css.root}>
			<div className={css.meta}>
				<ProjectAvatar className={css.ava} blockie={post.msg.senderAddress} />

				<div className={css.metaPrimary}>
					<div className={css.sender}>{project.name}</div>

					<div>
						<a
							className={clsx(css.metaAction, css.metaAction_interactive)}
							href={postUrl}
							onClick={e => {
								e.preventDefault();
								navigate(postUrl);
							}}
						>
							<ReadableDate value={post.msg.createdAt * 1000} />
						</a>
					</div>
				</div>

				<GridRowBox gap={8} className={css.metaRight}>
					{isAdminMode && (
						<button
							className={clsx(css.metaAction, css.metaAction_icon, css.metaAction_interactive)}
							title="Remove post"
							onClick={() => confirm('Are you sure you want to remove this post?') && banPost()}
						>
							<CrossSvg />
						</button>
					)}
				</GridRowBox>
			</div>

			<div className={css.body}>
				{isBanned && (
					<ErrorMessage look={ErrorMessageLook.INFO}>
						Post removed 👌
						<ActionButton onClick={() => unbanPost()}>Undo</ActionButton>
					</ErrorMessage>
				)}

				<div className={css.text}>
					<NlToBr text={decodedText} />
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
		</PostItemContainer>
	);
}

//

interface OfficialPostProps {
	project: BlockchainProject;
	post: DecodedBlockchainFeedPost;
}

export function OfficialPost({ project, post }: OfficialPostProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	return (
		<div style={{ position: 'relative' }}>
			<div ref={scrollRef} style={{ position: 'absolute', top: -100 }} />

			<OfficialPostView project={project} post={post} />
		</div>
	);
}
