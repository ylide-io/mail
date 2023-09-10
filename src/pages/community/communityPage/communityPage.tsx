import { observer } from 'mobx-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { InView } from 'react-intersection-observer';
import { useInfiniteQuery, useQuery } from 'react-query';
import { generatePath, Navigate, useParams } from 'react-router-dom';

import {
	BlockchainFeedApi,
	decodeBlockchainFeedPost,
	DecodedBlockchainFeedPost,
	useCommunityAdminsQuery,
} from '../../../api/blockchainFeedApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButton/ActionButton';
import { PrimaryCommunityCard } from '../../../components/communityCards/primaryCommunityCard/primaryCommunityCard';
import { ErrorMessage, ErrorMessageLook } from '../../../components/errorMessage/errorMessage';
import { RegularPageContent } from '../../../components/genericLayout/content/regularPageContent/regularPageContent';
import { GenericLayout } from '../../../components/genericLayout/genericLayout';
import { PageMeta } from '../../../components/pageMeta/pageMeta';
import { toast } from '../../../components/toast/toast';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { analytics } from '../../../stores/Analytics';
import { browserStorage } from '../../../stores/browserStorage';
import { Community, CommunityId, getCommunityById } from '../../../stores/communities/communities';
import { RoutePath } from '../../../stores/routePath';
import { connectAccount, getAllowedAccountsForBlockchains } from '../../../utils/account';
import { assertUnreachable, invariant } from '../../../utils/assert';
import { blockchainMeta, isEvmBlockchain } from '../../../utils/blockchain';
import { useIsMatchesPattern, useNav } from '../../../utils/url';
import { CreatePostForm, CreatePostFormApi } from '../_common/createPostForm/createPostForm';
import { DiscussionPost } from '../_common/discussionPost/discussionPost';
import { OfficialPost } from '../_common/officialPost/officialPost';
import css from './communityPage.module.scss';

interface OfficialContentProps {
	community: Community;
	setTabsAsideContent: (node: ReactNode) => void;
}

const OfficialContent = observer(({ community, setTabsAsideContent }: OfficialContentProps) => {
	const communityId = community.id;
	const feedId = community.feedId.official;
	invariant(feedId, 'No official feed id');

	const adminAccountsQuery = useCommunityAdminsQuery(community);
	const adminAccounts = adminAccountsQuery.data
		? getAllowedAccountsForBlockchains(community.allowedChains || []).filter(a =>
				adminAccountsQuery.data.includes(a.account.address),
		  )
		: [];
	const isAdminFeedMode = useIsMatchesPattern(RoutePath.PROJECT_ID_OFFICIAL_ADMIN) && !!adminAccounts.length;

	const postsQuery = useInfiniteQuery<DecodedBlockchainFeedPost[]>(['community', communityId, 'posts', 'official'], {
		cacheTime: 15 * 60 * 1000,
		queryFn: async ({ pageParam = 0 }) => {
			analytics.blockchainFeedView(community.id);

			const posts = await BlockchainFeedApi.getPosts({
				feedId,
				beforeTimestamp: pageParam,
				adminMode: isAdminFeedMode,
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

	useQuery(['community', communityId, 'new-posts', 'official'], {
		enabled: !postsQuery.isLoading,
		queryFn: async () => {
			const posts = await BlockchainFeedApi.getPosts({
				feedId,
				beforeTimestamp: 0,
				adminMode: isAdminFeedMode,
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
			} else {
				setTabsAsideContent(undefined);
			}
		},
		refetchInterval: 15 * 1000,
	});

	const renderLoadingError = () => <ErrorMessage>Couldn't load posts.</ErrorMessage>;

	return (
		<div className={css.content}>
			<PageMeta
				title={`${community.name} on Ylide Social Hub`}
				description={community.description}
				image={community.bannerImage}
			/>

			{!!adminAccounts.length && (
				<CreatePostForm
					community={community}
					feedId={feedId}
					accounts={adminAccounts}
					placeholder="Make a new post"
					onCreated={() => toast('Good job! Your post will appear shortly 🔥')}
				/>
			)}

			{messages.length ? (
				<>
					{messages.map((message, idx) => (
						<OfficialPost key={idx} community={community} post={message} />
					))}

					{postsQuery.isError
						? renderLoadingError()
						: postsQuery.hasNextPage && (
								<InView
									className={css.loader}
									rootMargin="100px"
									onChange={inView => {
										if (inView) {
											analytics.blockchainFeedLoadMore(community.id);
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
	community: Community;
	setTabsAsideContent: (node: ReactNode) => void;
}

const DiscussionContent = observer(({ community, setTabsAsideContent }: DiscussionContentProps) => {
	const communityId = community.id;
	const feedId = community.feedId.discussion;
	invariant(feedId, 'No discussion feed id');

	const accounts = getAllowedAccountsForBlockchains(community.allowedChains || []);
	const isAdminFeedMode = useIsMatchesPattern(RoutePath.PROJECT_ID_DISCUSSION_ADMIN) && browserStorage.isUserAdmin;

	const postsQuery = useInfiniteQuery<DecodedBlockchainFeedPost[]>(
		['community', communityId, 'posts', 'discussion'],
		{
			cacheTime: 15 * 60 * 1000,
			queryFn: async ({ pageParam = 0 }) => {
				analytics.blockchainFeedView(community.id);

				const posts = await BlockchainFeedApi.getPosts({
					feedId,
					beforeTimestamp: pageParam,
					adminMode: isAdminFeedMode,
				});
				return posts.map(decodeBlockchainFeedPost);
			},
			getNextPageParam: lastPage =>
				lastPage.length ? lastPage[lastPage.length - 1].original.createTimestamp : undefined,
		},
	);

	const messages = postsQuery.data?.pages.flat() || [];

	const reloadFeed = () => {
		setTabsAsideContent(undefined);
		postsQuery.remove();
		postsQuery.refetch();
	};

	useQuery(['community', communityId, 'new-posts', 'discussion'], {
		enabled: !postsQuery.isLoading,
		queryFn: async () => {
			const posts = await BlockchainFeedApi.getPosts({
				feedId,
				beforeTimestamp: 0,
				adminMode: isAdminFeedMode,
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
			} else {
				setTabsAsideContent(undefined);
			}
		},
		refetchInterval: 15 * 1000,
	});

	const renderLoadingError = () => <ErrorMessage>Couldn't load posts.</ErrorMessage>;

	const createPostFormRef = useRef<CreatePostFormApi>(null);

	function renderAllowedChainsText() {
		return (
			community.allowedChains?.length && (
				<div>
					Posting to this feed is allowed using{' '}
					<b>
						{community.allowedChains
							.reduce((list, chain) => {
								chain = isEvmBlockchain(chain) ? 'EVM' : blockchainMeta[chain].title;
								list.includes(chain) || list.push(chain);
								return list;
							}, [] as string[])
							.join(', ')}
					</b>{' '}
					only.
				</div>
			)
		);
	}

	return (
		<div className={css.content}>
			<PageMeta
				title={`${community.name} chat on Ylide Social Hub`}
				description={community.description}
				image={community.bannerImage}
			/>

			{accounts.length ? (
				<CreatePostForm
					ref={createPostFormRef}
					community={community}
					feedId={feedId}
					accounts={accounts}
					placeholder="What’s on your mind?"
					onCreated={() => toast('Good job! Your post will appear shortly 🔥')}
				/>
			) : (
				<ErrorMessage look={ErrorMessageLook.INFO}>
					<b>Connect your wallet to post messages to this feed 👌</b>

					{renderAllowedChainsText()}

					<ActionButton
						look={ActionButtonLook.PRIMARY}
						onClick={() => connectAccount({ place: 'community_no-accounts' })}
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
							community={community}
							post={message}
							onReplyClick={() => {
								analytics.blockchainFeedReply(community.id, message.original.id);

								if (accounts.length) {
									createPostFormRef.current?.replyTo(message);
								} else {
									toast(
										<>
											You need to connect an account in order to reply 👍
											{renderAllowedChainsText()}
										</>,
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
											analytics.blockchainFeedLoadMore(community.id);
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

export enum CommunityPagePart {
	OFFICIAL = 'OFFICIAL',
	DISCUSSION = 'DISCUSSION',
}

export const CommunityPage = observer(() => {
	const navigate = useNav();

	const { projectId } = useParams<{ projectId?: CommunityId }>();
	invariant(projectId, 'Project ID must be specified');

	const community = getCommunityById(projectId);
	invariant(community, 'Project not found');
	invariant(community.feedId.official || community.feedId.discussion, 'Project feed Id must be specified');

	const isCommunityRootPath = useIsMatchesPattern(RoutePath.PROJECT_ID);
	const isAnnouncementsPath = useIsMatchesPattern(RoutePath.PROJECT_ID_OFFICIAL, RoutePath.PROJECT_ID_OFFICIAL_ADMIN);
	const isDiscussionPath = useIsMatchesPattern(
		RoutePath.PROJECT_ID_DISCUSSION,
		RoutePath.PROJECT_ID_DISCUSSION_ADMIN,
	);

	const part = isAnnouncementsPath ? CommunityPagePart.OFFICIAL : CommunityPagePart.DISCUSSION;

	const [tabsAsideContent, setTabsAsideContent] = useState<ReactNode>();

	useEffect(() => {
		return () => setTabsAsideContent(undefined);
	}, [part]);

	function renderTab(params: { part: CommunityPagePart; name: ReactNode; href: string }) {
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

	if (isCommunityRootPath) {
		return (
			<Navigate
				replace
				to={
					community.feedId.discussion
						? generatePath(RoutePath.PROJECT_ID_DISCUSSION, { projectId })
						: generatePath(RoutePath.PROJECT_ID_OFFICIAL, { projectId })
				}
			/>
		);
	}

	if (isAnnouncementsPath && !community.feedId.official) {
		return <Navigate replace to={generatePath(RoutePath.PROJECT_ID_DISCUSSION, { projectId })} />;
	}

	if (isDiscussionPath && !community.feedId.discussion) {
		return <Navigate replace to={generatePath(RoutePath.PROJECT_ID_OFFICIAL, { projectId })} />;
	}

	return (
		<GenericLayout>
			<RegularPageContent key={projectId}>
				<PrimaryCommunityCard community={community} />

				<div className={css.main}>
					<div className={css.tabsWrapper}>
						<div className={css.tabs}>
							{!!community.feedId.discussion &&
								renderTab({
									part: CommunityPagePart.DISCUSSION,
									name: 'Discussion',
									href: generatePath(RoutePath.PROJECT_ID_DISCUSSION, {
										projectId: community.id,
									}),
								})}

							{!!community.feedId.official &&
								renderTab({
									part: CommunityPagePart.OFFICIAL,
									name: 'Announcements',
									href: generatePath(RoutePath.PROJECT_ID_OFFICIAL, { projectId: community.id }),
								})}
						</div>

						{tabsAsideContent && <div className={css.tabsAsideContent}>{tabsAsideContent}</div>}
					</div>

					{part === CommunityPagePart.OFFICIAL ? (
						<OfficialContent community={community} setTabsAsideContent={setTabsAsideContent} />
					) : part === CommunityPagePart.DISCUSSION ? (
						<DiscussionContent community={community} setTabsAsideContent={setTabsAsideContent} />
					) : (
						assertUnreachable(part)
					)}
				</div>
			</RegularPageContent>
		</GenericLayout>
	);
});
