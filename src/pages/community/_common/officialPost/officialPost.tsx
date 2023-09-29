import { MessageAttachmentLinkV1 } from '@ylide/sdk';
import clsx from 'clsx';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { generatePath } from 'react-router-dom';

import {
	BlockchainFeedApi,
	decodeBlockchainFeedPost,
	DecodedBlockchainFeedPost,
} from '../../../../api/blockchainFeedApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../components/ActionButton/ActionButton';
import { CommunityAvatar } from '../../../../components/avatar/avatar';
import { GridRowBox } from '../../../../components/boxes/boxes';
import { GalleryModal } from '../../../../components/galleryModal/galleryModal';
import { PostItemContainer } from '../../../../components/postItemContainer/postItemContainer';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { TextProcessor } from '../../../../components/textProcessor/textProcessor';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as CrossSvg } from '../../../../icons/ic20/cross.svg';
import { MessageDecodedTextDataType } from '../../../../indexedDB/IndexedDB';
import { browserStorage } from '../../../../stores/browserStorage';
import { Community, CommunityId } from '../../../../stores/communities/communities';
import domain from '../../../../stores/Domain';
import { RoutePath } from '../../../../stores/routePath';
import { getIpfsHashFromUrl, ipfsToHttpUrl } from '../../../../utils/ipfs';
import { ReactQueryKey } from '../../../../utils/reactQuery';
import { useNav } from '../../../../utils/url';
import { stickerIpfsIds } from '../createPostForm/stickerIpfsIds';
import { PostReactions } from '../postReactions/postReactions';
import css from './officialPost.module.scss';

export function generateOfficialPostPath(projectId: CommunityId, postId: string) {
	return generatePath(RoutePath.PROJECT_ID_OFFICIAL_POST_ID, { projectId, postId: encodeURIComponent(postId) });
}

interface OfficialPostViewProps {
	community: Community;
	post: DecodedBlockchainFeedPost;
}

export function OfficialPostView({ community, post: initialPost }: OfficialPostViewProps) {
	const navigate = useNav();
	const isAdminMode = browserStorage.isUserAdmin;

	const reloadPostQuery = useQuery(ReactQueryKey.communityPost(initialPost.original.id), {
		enabled: false,
		queryFn: async () => {
			const post = await BlockchainFeedApi.getPost({
				id: initialPost.original.id,
				addresses: domain.accounts.activeAccounts.map(a => a.account.address),
			});

			return decodeBlockchainFeedPost(post!);
		},
	});

	const post = reloadPostQuery.data || initialPost;
	const postUrl = generateOfficialPostPath(community.id, post.original.id);

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

	const [isRemoved, setRemoved] = useState(false);

	const unbanPost = useCallback(() => {
		BlockchainFeedApi.unbanPost({ ids: [post.msg.msgId], secret: browserStorage.adminPassword || '' })
			.then(() => {
				toast('Restored 🔥');
				setRemoved(false);
			})
			.catch(e => {
				toast('Error 🤦‍♀️');
				throw e;
			});
	}, [post.msg.msgId]);

	const banPost = useCallback(() => {
		BlockchainFeedApi.banPost({ ids: [post.msg.msgId], secret: browserStorage.adminPassword || '' })
			.then(() => {
				toast(
					<GridRowBox gap={4} spaceBetween>
						Removed 👌
						<ActionButton
							size={ActionButtonSize.XSMALL}
							look={ActionButtonLook.SECONDARY}
							onClick={() => unbanPost()}
						>
							Undo
						</ActionButton>
					</GridRowBox>,
				);
				setRemoved(true);
			})
			.catch(e => {
				if (e.message === 'Request failed') {
					toast('Wrong password 🤦‍♀️');
				} else {
					toast('Error 🤦‍♀️');
					throw e;
				}
			});
	}, [post.msg.msgId, unbanPost]);

	//

	return isRemoved ? (
		<></>
	) : (
		<PostItemContainer isCollapsable className={css.root}>
			<div className={css.meta}>
				<CommunityAvatar className={css.ava} community={community} />

				<div className={css.metaPrimary}>
					<div className={css.sender}>{community.name}</div>

					<div>
						<a
							className={clsx(css.actionItem, css.actionItem_interactive)}
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
							className={clsx(css.actionItem, css.actionItem_icon, css.actionItem_interactive)}
							title="Remove post"
							onClick={() => confirm('Are you sure you want to remove this post?') && banPost()}
						>
							<CrossSvg />
						</button>
					)}
				</GridRowBox>
			</div>

			<div className={css.body}>
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

			<div className={css.footer}>
				<PostReactions
					reactionButtonClassName={clsx(css.actionItem, css.actionItem_interactive, css.actionItem_icon)}
					post={post}
					reloadPost={reloadPostQuery.refetch}
				/>
			</div>
		</PostItemContainer>
	);
}

//

interface OfficialPostProps {
	community: Community;
	post: DecodedBlockchainFeedPost;
}

export function OfficialPost({ community, post }: OfficialPostProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	return (
		<div style={{ position: 'relative' }}>
			<div ref={scrollRef} style={{ position: 'absolute', top: -100 }} />

			<OfficialPostView community={community} post={post} />
		</div>
	);
}
