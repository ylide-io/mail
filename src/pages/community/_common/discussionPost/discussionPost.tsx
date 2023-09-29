import { MessageAttachmentLinkV1 } from '@ylide/sdk';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
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
import { ReactionBadge } from '../../../../components/reactionBadge/reactionBadge';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { Recipients } from '../../../../components/recipientInput/recipientInput';
import { SetReactionFlow } from '../../../../components/setReactionFlow/setReactionFlow';
import { Spinner, SpinnerLook } from '../../../../components/spinner/spinner';
import { TextProcessor } from '../../../../components/textProcessor/textProcessor';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as CrossSvg } from '../../../../icons/ic20/cross.svg';
import { ReactComponent as ExternalSvg } from '../../../../icons/ic20/external.svg';
import { ReactComponent as MailSvg } from '../../../../icons/ic20/mail.svg';
import { ReactComponent as ReplySvg } from '../../../../icons/ic20/reply.svg';
import { ReactComponent as SmileSvg } from '../../../../icons/ic20/smile.svg';
import { ReactComponent as TickSvg } from '../../../../icons/ic20/tick.svg';
import { MessageDecodedTextDataType } from '../../../../indexedDB/IndexedDB';
import { analytics } from '../../../../stores/Analytics';
import { browserStorage } from '../../../../stores/browserStorage';
import { Community, CommunityId } from '../../../../stores/communities/communities';
import domain from '../../../../stores/Domain';
import { DomainAccount } from '../../../../stores/models/DomainAccount';
import { OutgoingMailData } from '../../../../stores/outgoingMailData';
import { RoutePath } from '../../../../stores/routePath';
import { invariant } from '../../../../utils/assert';
import { generateBlockchainExplorerUrl } from '../../../../utils/blockchain';
import { copyToClipboard } from '../../../../utils/clipboard';
import { getIpfsHashFromUrl, ipfsToHttpUrl } from '../../../../utils/ipfs';
import { useOpenMailCompose } from '../../../../utils/mail';
import { getAccountsForReaction } from '../../../../utils/reactions';
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

export const DiscussionPost = observer(({ post: initialPost, community, onReplyClick }: DiscussionPostProps) => {
	const navigate = useNav();
	const isAdminMode = browserStorage.isUserAdmin;

	// Workaround for https://github.com/TanStack/query/issues/6067
	const [reloadedPost, setReloadedPost] = useState<DecodedBlockchainFeedPost>();
	useEffect(() => setReloadedPost(undefined), [initialPost.original.id]);

	const reloadPostMutation = useMutation({
		mutationFn: async () => {
			const post = await BlockchainFeedApi.getPost({
				id: initialPost.original.id,
				addresses: domain.accounts.activeAccounts.map(a => a.account.address),
			});
			setReloadedPost(decodeBlockchainFeedPost(post!));
		},
	});

	const post = reloadedPost || initialPost;

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
			const post = await BlockchainFeedApi.getPost({
				id: replyToId!,
				addresses: accounts.map(a => a.account.address),
			});
			return post ? decodeBlockchainFeedPost(post) : undefined;
		},
	});

	//

	const onComposeMailClick = () => {
		analytics.blockchainFeedComposeMail(post.original.id, post.msg.senderAddress);

		const mailData = new OutgoingMailData();
		mailData.from = accounts[0];
		mailData.to = new Recipients([post.msg.senderAddress]);

		openMailCompose({ mailData, place: 'project-discussion' });
	};

	//

	const reactionsCountsEntries = Object.entries(post.original.reactionsCounts);

	const setReactionMutation = useMutation({
		mutationFn: async (variables: { reaction: string; account: DomainAccount }) => {
			invariant(variables.account.authKey, 'No auth key');

			await BlockchainFeedApi.setReaction({
				postId: post.msg.msgId,
				reaction: variables.reaction,
				authKey: variables.account.authKey,
			});

			await reloadPostMutation.mutateAsync();
		},
		onError: error => {
			toast(`Couldn't set reaction 😟`);
			console.error(error);
		},
	});

	const setReaction = async (reaction: string, account: DomainAccount) => {
		if (setReactionMutation.isLoading || removeReactionMutation.isLoading) return;

		await setReactionMutation.mutateAsync({ reaction, account });
	};

	const removeReactionMutation = useMutation({
		mutationFn: async (variables: { accounts: DomainAccount[] }) => {
			await Promise.all(
				variables.accounts
					.filter(account => account.authKey && post.original.addressReactions[account.account.address])
					.map(account =>
						BlockchainFeedApi.removeReaction({
							postId: post.msg.msgId,
							authKey: account.authKey,
						}),
					),
			);

			await reloadPostMutation.mutateAsync();
		},
		onError: error => {
			toast(`Couldn't remove reaction 😟`);
			console.error(error);
		},
	});

	const removeReaction = async (accounts: DomainAccount[]) => {
		if (setReactionMutation.isLoading || removeReactionMutation.isLoading) return;

		await removeReactionMutation.mutateAsync({ accounts });
	};

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
							maxLength={24}
							address={post.msg.senderAddress}
							onClick={e => {
								if (e.shiftKey && browserStorage.isUserAdmin) {
									banAddress();
								} else {
									copyToClipboard(post.msg.senderAddress, { toast: true });
								}
							}}
						/>
					</div>

					<div className={css.metaRight}>
						<BlockChainLabel className={css.chainLabel} blockchain={blockchain} />

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

						<button
							className={clsx(css.actionItem, css.actionItem_icon, css.actionItem_interactive)}
							title="Reply"
							onClick={onReplyClick}
						>
							<ReplySvg />
						</button>

						<button
							className={clsx(css.actionItem, css.actionItem_icon, css.actionItem_interactive)}
							title="Send private message"
							onClick={onComposeMailClick}
						>
							<MailSvg />
						</button>

						<SetReactionFlow onSelect={setReaction}>
							{({ anchorRef, onAnchorClick }) => (
								<button
									ref={anchorRef}
									className={clsx(css.actionItem, css.actionItem_icon, css.actionItem_interactive)}
									title="Reactions"
									onClick={() => onAnchorClick()}
								>
									{setReactionMutation.isLoading || removeReactionMutation.isLoading ? (
										<Spinner size={16} />
									) : (
										<SmileSvg />
									)}
								</button>
							)}
						</SetReactionFlow>

						{reactionsCountsEntries.length ? (
							<div className={css.reactions}>
								{reactionsCountsEntries.map(([reaction, count]) => {
									const accountsForReaction = getAccountsForReaction(
										reaction,
										post.original.addressReactions,
									);

									return accountsForReaction.length ? (
										<ReactionBadge
											reaction={reaction}
											counter={count || 1}
											isActive
											onClick={() => removeReaction(accountsForReaction)}
										/>
									) : (
										<SetReactionFlow
											key={reaction}
											initialReaction={reaction}
											onSelect={setReaction}
										>
											{({ anchorRef, onAnchorClick }) => (
												<ReactionBadge
													ref={anchorRef}
													reaction={reaction}
													counter={count || 1}
													onClick={onAnchorClick}
												/>
											)}
										</SetReactionFlow>
									);
								})}
							</div>
						) : (
							<div className={css.noReactions}>
								{['❤️', '👍', '🎉'].map(reaction => (
									<SetReactionFlow key={reaction} initialReaction={reaction} onSelect={setReaction}>
										{({ anchorRef, onAnchorClick }) => (
											<ReactionBadge
												ref={anchorRef}
												reaction={reaction}
												onClick={onAnchorClick}
											/>
										)}
									</SetReactionFlow>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
});
