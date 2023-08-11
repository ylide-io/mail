import { observer } from 'mobx-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { InView } from 'react-intersection-observer';
import { useInfiniteQuery, useQuery } from 'react-query';
import { generatePath, useParams } from 'react-router-dom';

import { BlockchainFeedApi, decodeBlockchainFeedPost, DecodedBlockchainFeedPost } from '../../../api/blockchainFeedApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButton/ActionButton';
import { ProjectAvatar } from '../../../components/avatar/avatar';
import { BlockchainProjectBanner } from '../../../components/blockchainProjectBanner/blockchainProjectBanner';
import { ErrorMessage, ErrorMessageLook } from '../../../components/errorMessage/errorMessage';
import { RegularPageContent } from '../../../components/genericLayout/content/regularPageContent/regularPageContent';
import { GenericLayout } from '../../../components/genericLayout/genericLayout';
import { PageMeta } from '../../../components/pageMeta/pageMeta';
import { toast } from '../../../components/toast/toast';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { ReactComponent as LinkSvg } from '../../../icons/ic20/link.svg';
import { ReactComponent as TagSvg } from '../../../icons/ic20/tag.svg';
import { analytics } from '../../../stores/Analytics';
import {
	BlockchainProject,
	BlockchainProjectAttachmentMode,
	BlockchainProjectId,
	getBlockchainProjectBannerImage,
	getBlockchainProjectById,
} from '../../../stores/blockchainProjects/blockchainProjects';
import { browserStorage } from '../../../stores/browserStorage';
import domain from '../../../stores/Domain';
import { RoutePath } from '../../../stores/routePath';
import { connectAccount } from '../../../utils/account';
import { assertUnreachable, invariant } from '../../../utils/assert';
import { blockchainMeta, BlockchainName, isEvmBlockchain } from '../../../utils/blockchain';
import { useIsMatchesPattern, useNav } from '../../../utils/url';
import { CreatePostForm, CreatePostFormApi } from '../_common/createPostForm/createPostForm';
import { DiscussionPost } from '../_common/discussionPost/discussionPost';
import { OfficialPost } from '../_common/officialPost/officialPost';
import css from './blockchainProjectPage.module.scss';

function getAllowedAccountForProject(project: BlockchainProject) {
	return project.fixedChain === BlockchainName.VENOM_TESTNET
		? domain.accounts.activeVenomAccounts
		: isEvmBlockchain(project.fixedChain)
		? domain.accounts.activeEvmAccounts
		: domain.accounts.activeAccounts;
}

//

interface OfficialContentProps {
	project: BlockchainProject;
	setTabsAsideContent: (node: ReactNode) => void;
}

const OfficialContent = observer(({ project, setTabsAsideContent }: OfficialContentProps) => {
	const projectId = project.id;
	const feedId = project.feedId.official;
	invariant(feedId, 'No official feed id');

	const isAdminMode = useIsMatchesPattern(RoutePath.PROJECT_ADMIN) && browserStorage.isUserAdmin;
	const accounts = getAllowedAccountForProject(project);

	const postsQuery = useInfiniteQuery<DecodedBlockchainFeedPost[]>(['project', projectId, 'posts', 'official'], {
		queryFn: async ({ pageParam = 0 }) => {
			analytics.blockchainFeedView(project.id);

			const posts = await BlockchainFeedApi.getPosts({
				feedId,
				beforeTimestamp: pageParam,
				adminMode: isAdminMode,
			});
			return posts.map(decodeBlockchainFeedPost);
		},
		getNextPageParam: lastPage =>
			lastPage.length ? lastPage[lastPage.length - 1].original.createTimestamp : undefined,
	});

	const messages = postsQuery.data?.pages.flat() || [];

	const reloadFeed = () => {
		setTabsAsideContent(undefined);
		postsQuery.remove();
		postsQuery.refetch();
	};

	useQuery(['project', projectId, 'new-posts', 'official'], {
		queryFn: async () => {
			if (!postsQuery.isLoading) {
				const posts = await BlockchainFeedApi.getPosts({
					feedId,
					beforeTimestamp: 0,
					adminMode: isAdminMode,
				});
				const hasNewPosts = !!(posts.length && messages.length && posts[0].id !== messages[0].original.id);
				if (hasNewPosts) {
					return setTabsAsideContent(
						<ActionButton
							className={css.newPostsButton}
							look={ActionButtonLook.SECONDARY}
							onClick={() => reloadFeed()}
						>
							Load new posts
						</ActionButton>,
					);
				}
			}

			setTabsAsideContent(undefined);
		},
		refetchInterval: 15 * 1000,
	});

	const renderLoadingError = () => <ErrorMessage>Couldn't load posts.</ErrorMessage>;

	return (
		<div className={css.content}>
			<PageMeta
				title={`${project.name} on Ylide Social Hub`}
				description={project.description}
				image={project.bannerImage}
			/>

			{isAdminMode && !!accounts.length && (
				<CreatePostForm
					accounts={accounts}
					feedId={feedId}
					allowCustomAttachments={
						project.attachmentMode === BlockchainProjectAttachmentMode.EVERYONE ||
						(isAdminMode && project.attachmentMode === BlockchainProjectAttachmentMode.ADMINS)
					}
					placeholder="Make a new post"
					fixedChain={project.fixedChain}
					onCreated={() => toast('Good job! Your post will appear shortly 🔥')}
				/>
			)}

			{messages.length ? (
				<>
					{messages.map((message, idx) => (
						<OfficialPost key={idx} project={project} post={message} />
					))}

					{postsQuery.isError
						? renderLoadingError()
						: postsQuery.hasNextPage && (
								<InView
									className={css.loader}
									rootMargin="100px"
									onChange={inView => {
										if (inView) {
											analytics.blockchainFeedLoadMore(project.id);
											postsQuery.fetchNextPage();
										}
									}}
								>
									<YlideLoader reason="Loading more posts ..." />
								</InView>
						  )}
				</>
			) : postsQuery.isLoading ? (
				<div className={css.loader}>
					<YlideLoader reason="Your feed is loading ..." />
				</div>
			) : postsQuery.isError ? (
				renderLoadingError()
			) : (
				<ErrorMessage look={ErrorMessageLook.INFO}>No messages yet</ErrorMessage>
			)}
		</div>
	);
});

//

interface DiscussionContentProps {
	project: BlockchainProject;
	setTabsAsideContent: (node: ReactNode) => void;
}

const DiscussionContent = observer(({ project, setTabsAsideContent }: DiscussionContentProps) => {
	const projectId = project.id;
	const feedId = project.feedId.discussion;
	invariant(feedId, 'No discussion feed id');

	const isAdminMode = useIsMatchesPattern(RoutePath.PROJECT_ADMIN) && browserStorage.isUserAdmin;
	const accounts = getAllowedAccountForProject(project);

	const postsQuery = useInfiniteQuery<DecodedBlockchainFeedPost[]>(['project', projectId, 'posts', 'discussion'], {
		queryFn: async ({ pageParam = 0 }) => {
			analytics.blockchainFeedView(project.id);

			const posts = await BlockchainFeedApi.getPosts({
				feedId,
				beforeTimestamp: pageParam,
				adminMode: isAdminMode,
			});
			return posts.map(decodeBlockchainFeedPost);
		},
		getNextPageParam: lastPage =>
			lastPage.length ? lastPage[lastPage.length - 1].original.createTimestamp : undefined,
	});

	const messages = postsQuery.data?.pages.flat() || [];

	const reloadFeed = () => {
		setTabsAsideContent(undefined);
		postsQuery.remove();
		postsQuery.refetch();
	};

	useQuery(['project', projectId, 'new-posts', 'discussion'], {
		queryFn: async () => {
			if (!postsQuery.isLoading) {
				const posts = await BlockchainFeedApi.getPosts({
					feedId,
					beforeTimestamp: 0,
					adminMode: isAdminMode,
				});
				const hasNewPosts = !!(posts.length && messages.length && posts[0].id !== messages[0].original.id);
				if (hasNewPosts) {
					return setTabsAsideContent(
						<ActionButton
							className={css.newPostsButton}
							look={ActionButtonLook.SECONDARY}
							onClick={() => reloadFeed()}
						>
							Load new posts
						</ActionButton>,
					);
				}
			}

			setTabsAsideContent(undefined);
		},
		refetchInterval: 15 * 1000,
	});

	const renderLoadingError = () => <ErrorMessage>Couldn't load posts.</ErrorMessage>;

	const createPostFormRef = useRef<CreatePostFormApi>(null);

	return (
		<div className={css.content}>
			<PageMeta
				title={`${project.name} chat on Ylide Social Hub`}
				description={project.description}
				image={project.bannerImage}
			/>

			{accounts.length ? (
				<CreatePostForm
					ref={createPostFormRef}
					accounts={accounts}
					feedId={feedId}
					allowCustomAttachments={
						projectId === BlockchainProjectId.ETH_WHALES ||
						projectId === BlockchainProjectId.TVM ||
						isAdminMode
					}
					placeholder="What’s on your mind?"
					fixedChain={project.fixedChain}
					onCreated={() => toast('Good job! Your post will appear shortly 🔥')}
				/>
			) : (
				<ErrorMessage look={ErrorMessageLook.INFO}>
					<div>
						<b>Connect your wallet to post messages to this feed 👌</b>
						{project.fixedChain &&
							` Posting is allowed using ${
								(project.fixedChain && blockchainMeta[project.fixedChain].title) || ''
							} blockchain only.`}
					</div>

					<ActionButton
						look={ActionButtonLook.PRIMARY}
						onClick={() => connectAccount({ place: 'blockchain-project-feed_no-accounts' })}
					>
						Connect account
					</ActionButton>
				</ErrorMessage>
			)}

			{messages.length ? (
				<>
					{messages.map((message, idx) => (
						<DiscussionPost
							key={idx}
							project={project}
							post={message}
							onReplyClick={() => {
								analytics.blockchainFeedReply(project.id, message.original.id);

								if (accounts.length) {
									createPostFormRef.current?.replyTo(message);
								} else {
									toast(
										`You need to connect ${
											project.fixedChain === BlockchainName.VENOM_TESTNET
												? 'a Venom'
												: isEvmBlockchain(project.fixedChain)
												? 'an EVM'
												: 'an'
										} account in order to reply 👍`,
									);
								}
							}}
						/>
					))}

					{postsQuery.isError
						? renderLoadingError()
						: postsQuery.hasNextPage && (
								<InView
									className={css.loader}
									rootMargin="100px"
									onChange={inView => {
										if (inView) {
											analytics.blockchainFeedLoadMore(project.id);
											postsQuery.fetchNextPage();
										}
									}}
								>
									<YlideLoader reason="Loading more posts ..." />
								</InView>
						  )}
				</>
			) : postsQuery.isLoading ? (
				<div className={css.loader}>
					<YlideLoader reason="Your feed is loading ..." />
				</div>
			) : postsQuery.isError ? (
				renderLoadingError()
			) : (
				<ErrorMessage look={ErrorMessageLook.INFO}>No messages yet</ErrorMessage>
			)}
		</div>
	);
});

//

export enum BlockchainProjectPagePart {
	OFFICIAL = 'OFFICIAL',
	DISCUSSION = 'DISCUSSION',
}

export const BlockchainProjectPage = observer(() => {
	const navigate = useNav();

	const { projectId } = useParams<{ projectId?: BlockchainProjectId }>();
	invariant(projectId, 'Blockchain project ID must be specified');

	const project = getBlockchainProjectById(projectId);
	invariant(project, 'Blockchain project not found');

	const part =
		useIsMatchesPattern(RoutePath.PROJECT) && project.feedId.official
			? BlockchainProjectPagePart.OFFICIAL
			: BlockchainProjectPagePart.DISCUSSION;

	const [tabsAsideContent, setTabsAsideContent] = useState<ReactNode>();

	useEffect(() => {
		return () => setTabsAsideContent(undefined);
	}, [part]);

	function renderTab(params: { part: BlockchainProjectPagePart; name: ReactNode; href: string }) {
		const isActive = params.part === part;
		const look = isActive ? ActionButtonLook.HEAVY : ActionButtonLook.LITE;

		return (
			<ActionButton
				size={ActionButtonSize.MEDIUM}
				look={look}
				onClick={() => isActive || navigate(params.href, { preventScrollReset: true })}
			>
				{params.name}
			</ActionButton>
		);
	}

	return (
		<GenericLayout>
			<RegularPageContent>
				<div key={projectId}>
					<BlockchainProjectBanner
						className={css.projectBanner}
						image={getBlockchainProjectBannerImage(project)}
					/>

					<ProjectAvatar
						className={css.projectLogo}
						innerClassName={css.projectLogoInner}
						image={project.profileImage || 'https://picsum.photos/id/1067/200'}
					/>

					<h1 className={css.projectName}>{project.name}</h1>

					<div className={css.projectDescription}>{project.description}</div>

					{(project.website || !!project.tags.length) && (
						<div className={css.projectMeta}>
							{project.website && (
								<a className={css.projectWebsite} href={project.website}>
									<LinkSvg />

									{project.website}
								</a>
							)}

							{!!project.tags.length && (
								<div className={css.tags}>
									{project.tags.map(tag => (
										<div key={tag} className={css.tag}>
											<TagSvg />
											{tag}
										</div>
									))}
								</div>
							)}
						</div>
					)}

					<div className={css.main}>
						<div className={css.tabsWrapper}>
							<div className={css.tabs}>
								{!!project.feedId.official &&
									renderTab({
										part: BlockchainProjectPagePart.OFFICIAL,
										name: 'Official',
										href: generatePath(RoutePath.PROJECT, { projectId: project.id }),
									})}

								{!!project.feedId.discussion &&
									renderTab({
										part: BlockchainProjectPagePart.DISCUSSION,
										name: 'Discussion',
										href: generatePath(RoutePath.PROJECT_DISCUSSION, { projectId: project.id }),
									})}
							</div>

							{tabsAsideContent && <div className={css.tabsAsideContent}>{tabsAsideContent}</div>}
						</div>

						{part === BlockchainProjectPagePart.OFFICIAL ? (
							<OfficialContent project={project} setTabsAsideContent={setTabsAsideContent} />
						) : part === BlockchainProjectPagePart.DISCUSSION ? (
							<DiscussionContent project={project} setTabsAsideContent={setTabsAsideContent} />
						) : (
							assertUnreachable(part)
						)}
					</div>
				</div>
			</RegularPageContent>
		</GenericLayout>
	);
});
