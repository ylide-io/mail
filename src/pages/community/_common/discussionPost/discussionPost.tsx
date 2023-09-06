import { MessageAttachmentLinkV1 } from '@ylide/sdk';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { generatePath } from 'react-router-dom';

import {
	BlockchainFeedApi,
	decodeBlockchainFeedPost,
	DecodedBlockchainFeedPost,
} from '../../../../api/blockchainFeedApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../components/ActionButton/ActionButton';
import { AdaptiveAddress } from '../../../../components/adaptiveAddress/adaptiveAddress';
import { Avatar } from '../../../../components/avatar/avatar';
import { BlockChainLabel } from '../../../../components/BlockChainLabel/BlockChainLabel';
import { GridRowBox } from '../../../../components/boxes/boxes';
import { GalleryModal } from '../../../../components/galleryModal/galleryModal';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { Recipients } from '../../../../components/recipientInput/recipientInput';
import { Spinner, SpinnerLook } from '../../../../components/spinner/spinner';
import { TextProcessor } from '../../../../components/textProcessor/textProcessor';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as CrossSvg } from '../../../../icons/ic20/cross.svg';
import { ReactComponent as ExternalSvg } from '../../../../icons/ic20/external.svg';
import { ReactComponent as MailSvg } from '../../../../icons/ic20/mail.svg';
import { ReactComponent as TickSvg } from '../../../../icons/ic20/tick.svg';
import { MessageDecodedTextDataType } from '../../../../indexedDB/IndexedDB';
import { analytics } from '../../../../stores/Analytics';
import { browserStorage } from '../../../../stores/browserStorage';
import { Community, CommunityId } from '../../../../stores/communities/communities';
import domain from '../../../../stores/Domain';
import { OutgoingMailData } from '../../../../stores/outgoingMailData';
import { RoutePath } from '../../../../stores/routePath';
import { generateBlockchainExplorerUrl } from '../../../../utils/blockchain';
import { copyToClipboard } from '../../../../utils/clipboard';
import { getIpfsHashFromUrl, ipfsToHttpUrl } from '../../../../utils/ipfs';
import { useOpenMailCompose } from '../../../../utils/mail';
import { useNav } from '../../../../utils/url';
import { stickerIpfsIds } from '../createPostForm/stickerIpfsIds';
import { RepliedDiscussionPost } from '../repliedDiscussionPost/repliedDiscussionPost';
import css from './discussionPost.module.scss';

export function generateDiscussionPostPath(projectId: CommunityId, postId: string) {
	return generatePath(RoutePath.PROJECT_ID_DISCUSSION_POST_ID, { projectId, postId: encodeURIComponent(postId) });
}

//

interface DiscussionPostProps {
	post: DecodedBlockchainFeedPost;
	community: Community;
	onReplyClick?: () => void;
}

export const DiscussionPost = observer(({ post, community, onReplyClick }: DiscussionPostProps) => {
	const navigate = useNav();
	const isAdminMode = browserStorage.isUserAdmin;

	const isAuthorAdmin = !!post.original.isAdmin;
	const blockchain = post.original.blockchain;
	const txId = post.msg.$$meta.tx?.hash || post.msg.$$meta.id;
	const postUrl = generateDiscussionPostPath(community.id, post.original.id);
	const explorerUrl = generateBlockchainExplorerUrl(blockchain, txId);

	const openMailCompose = useOpenMailCompose();
	const accounts = domain.accounts.activeAccounts;

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

	const replyToId = useMemo(() => {
		if (decodedTextData.type === MessageDecodedTextDataType.YMF) {
			const firstChild = decodedTextData.value.root.children[0];

			if (firstChild?.type === 'tag' && firstChild.tag === 'reply-to') {
				return firstChild.attributes.id || undefined;
			}
		}
	}, [decodedTextData]);

	const repliedPostQuery = useQuery(['feed', 'venom', 'reply-to', replyToId], {
		enabled: !!replyToId,
		queryFn: async () => {
			const post = await BlockchainFeedApi.getPost({ id: replyToId! });
			return post ? decodeBlockchainFeedPost(post) : undefined;
		},
	});

	//

	const [isReviewed, setReviewed] = useState(false);

	const unbanPost = useCallback(() => {
		BlockchainFeedApi.unbanPost({ ids: [post.msg.msgId], secret: browserStorage.adminPassword || '' })
			.then(() => {
				toast('Un-banned 🔥');
				setReviewed(false);
			})
			.catch(e => {
				toast('Error 🤦‍♀️');
				throw e;
			});
	}, [post.msg.msgId]);

	const banAddress = useCallback(() => {
		BlockchainFeedApi.banAddresses({
			addresses: [post.msg.senderAddress],
			secret: browserStorage.adminPassword || '',
		})
			.then(() => {
				toast('Banned 🔥');
				setReviewed(true);
			})
			.catch(e => {
				if (e.message === 'Request failed') {
					toast('Wrong password 🤦‍♀️');
				} else {
					toast('Error 🤦‍♀️');
					throw e;
				}
			});
	}, [post.msg.senderAddress]);

	const banPost = useCallback(() => {
		BlockchainFeedApi.banPost({ ids: [post.msg.msgId], secret: browserStorage.adminPassword || '' })
			.then(() => {
				toast(
					<GridRowBox gap={4} spaceBetween>
						Banned 🔥
						<ActionButton
							size={ActionButtonSize.XSMALL}
							look={ActionButtonLook.SECONDARY}
							onClick={() => unbanPost()}
						>
							Undo
						</ActionButton>
					</GridRowBox>,
				);
				setReviewed(true);
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

	const approvePost = useCallback(() => {
		BlockchainFeedApi.approvePost({ ids: [post.msg.msgId], secret: browserStorage.adminPassword || '' })
			.then(() => {
				toast('Approved 🔥');
				setReviewed(true);
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

	//

	return isReviewed ? (
		<></>
	) : (
		<div className={css.root}>
			<Avatar blockie={post.msg.senderAddress} />

			<div className={css.body}>
				<div className={css.meta}>
					<div className={css.metaLeft}>
						{isAuthorAdmin && <div className={css.adminTag}>Admin</div>}

						<AdaptiveAddress
							className={css.sender}
							contentClassName={isAuthorAdmin ? css.senderContent_admin : undefined}
							maxLength={12}
							address={post.msg.senderAddress}
							onClick={e => {
								if (e.shiftKey && browserStorage.isUserAdmin) {
									banAddress();
								} else {
									copyToClipboard(post.msg.senderAddress, { toast: true });
								}
							}}
						/>

						<button
							className={clsx(css.actionItem, css.actionItem_icon, css.actionItem_interactive)}
							title="Compose mail"
							onClick={() => {
								analytics.blockchainFeedComposeMail(post.original.id, post.msg.senderAddress);

								const mailData = new OutgoingMailData();
								mailData.from = accounts[0];
								mailData.to = new Recipients([post.msg.senderAddress]);

								openMailCompose({ mailData, place: 'project-discussion' });
							}}
						>
							<MailSvg />
						</button>
					</div>

					<div className={css.metaRight}>
						<BlockChainLabel blockchain={blockchain} />

						{explorerUrl && (
							<a
								className={clsx(css.actionItem, css.actionItem_icon, css.actionItem_interactive)}
								href={explorerUrl}
								target="_blank"
								rel="noreferrer"
								title="Details"
								onClick={() =>
									analytics.blockchainFeedOpenDetails(post.original.id, post.msg.$$meta.id)
								}
							>
								<ExternalSvg />
							</a>
						)}

						{isAdminMode && (
							<button
								className={clsx(css.actionItem, css.actionItem_icon, css.actionItem_interactive)}
								title="Approve post"
								onClick={() => approvePost()}
							>
								<TickSvg />
							</button>
						)}

						{isAdminMode && (
							<button
								className={clsx(css.actionItem, css.actionItem_icon, css.actionItem_interactive)}
								title="Ban post"
								onClick={() => banPost()}
							>
								<CrossSvg />
							</button>
						)}
					</div>
				</div>

				{replyToId && (
					<div>
						{repliedPostQuery.data ? (
							<RepliedDiscussionPost post={repliedPostQuery.data} />
						) : repliedPostQuery.isLoading ? (
							<GridRowBox>
								<Spinner look={SpinnerLook.SECONDARY} />
								Loading original post ...
							</GridRowBox>
						) : (
							"Couldn't load original post"
						)}
					</div>
				)}

				<div className={css.content}>
					{!!decodedText && (
						<div className={css.text}>
							<TextProcessor text={decodedText} nlToBr linksToAnchors unsafeLinks />
						</div>
					)}

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

					<div className={css.contentFooter}>
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

						<button className={clsx(css.actionItem, css.actionItem_interactive)} onClick={onReplyClick}>
							<b>Reply</b>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
});
