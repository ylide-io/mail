import { observer } from 'mobx-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { InView } from 'react-intersection-observer';
import { useInfiniteQuery, useQuery } from 'react-query';
import { generatePath, matchPath, matchRoutes, useLocation, useParams } from 'react-router-dom';

import { FeedCategory, FeedServerApi } from '../../../api/feedServerApi';
import { DecodedVenomFeedPost, decodeVenomFeedPost, VenomFilterApi } from '../../../api/venomFilterApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButton/ActionButton';
import { ErrorMessage, ErrorMessageLook } from '../../../components/errorMessage/errorMessage';
import { NarrowContent } from '../../../components/genericLayout/content/narrowContent/narrowContent';
import { GenericLayout, useGenericLayoutApi } from '../../../components/genericLayout/genericLayout';
import { toast } from '../../../components/toast/toast';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { AppMode, REACT_APP__APP_MODE } from '../../../env';
import { ReactComponent as ArrowUpSvg } from '../../../icons/ic20/arrowUp.svg';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import { analytics } from '../../../stores/Analytics';
import { useDomainAccounts, useVenomAccounts } from '../../../stores/Domain';
import { FeedStore, getFeedCategoryName } from '../../../stores/Feed';
import { RoutePath } from '../../../stores/routePath';
import { VenomProjectId, venomProjectsMeta } from '../../../stores/venomProjects/venomProjects';
import { connectAccount } from '../../../utils/account';
import { invariant } from '../../../utils/assert';
import { useNav } from '../../../utils/url';
import { CreatePostForm, CreatePostFormApi } from '../components/createPostForm/createPostForm';
import { FeedPostItem } from '../components/feedPostItem/feedPostItem';
import { VenomFeedPostItem } from '../components/venomFeedPostItem/venomFeedPostItem';
import css from './feedPage.module.scss';
import ErrorCode = FeedServerApi.ErrorCode;

const RegularFeedContent = observer(() => {
	const location = useLocation();
	const navigate = useNav();
	const accounts = useDomainAccounts();
	const genericLayoutApi = useGenericLayoutApi();

	const { category, source, address } = useParams<{ category: FeedCategory; source: string; address: string }>();
	const isAllPosts = !!matchPath(RoutePath.FEED_ALL, location.pathname);

	const selectedAccounts = useMemo(
		() =>
			address
				? accounts.filter(a => a.account.address === address)
				: !category && !source && !isAllPosts
				? accounts
				: [],
		[accounts, address, category, isAllPosts, source],
	);

	useEffect(() => {
		if (address && !selectedAccounts.length) {
			navigate(generatePath(RoutePath.FEED));
		}
	}, [address, navigate, selectedAccounts]);

	// We can NOT load smart feed if no suitable account connected
	const canLoadFeed =
		!!category ||
		isAllPosts ||
		(!!accounts.length && (REACT_APP__APP_MODE !== AppMode.MAIN_VIEW || accounts.every(a => a.mainViewKey)));

	const feed = useMemo(() => {
		const feed = new FeedStore({
			categories: category ? [category] : isAllPosts ? Object.values(FeedCategory) : undefined,
			sourceId: source,
			addressTokens: selectedAccounts.map(a => a.mainViewKey),
		});

		genericLayoutApi.scrollToTop();

		if (canLoadFeed) {
			feed.load();
		}

		return feed;
	}, [canLoadFeed, category, genericLayoutApi, isAllPosts, selectedAccounts, source]);

	return (
		<NarrowContent
			title={
				feed.categories.length === 1
					? getFeedCategoryName(feed.categories[0])
					: feed.sourceId || isAllPosts
					? 'Feed'
					: 'Smart feed'
			}
			titleSubItem={
				!!source && (
					<ActionButton
						look={ActionButtonLook.PRIMARY}
						icon={<CrossSvg />}
						onClick={() => navigate(generatePath(RoutePath.FEED))}
					>
						Clear filter
					</ActionButton>
				)
			}
			titleRight={
				!!feed.newPosts && (
					<ActionButton look={ActionButtonLook.SECONDARY} onClick={() => feed.loadNew()}>
						Show {feed.newPosts} new posts
					</ActionButton>
				)
			}
		>
			{!!feed.posts.length && (
				<ActionButton
					className={css.scrollToTop}
					size={ActionButtonSize.XLARGE}
					look={ActionButtonLook.SECONDARY}
					icon={<ArrowUpSvg />}
					onClick={() => genericLayoutApi.scrollToTop()}
				/>
			)}

			<div className={css.posts}>
				{feed.loaded ? (
					<>
						{feed.posts.map(post => (
							<FeedPostItem key={post.id} isInFeed realtedAccounts={selectedAccounts} post={post} />
						))}

						{feed.moreAvailable && (
							<InView
								className={css.loader}
								rootMargin="100px"
								onChange={inView => inView && feed.loadMore()}
							>
								<YlideLoader reason="Loading more posts ..." />
							</InView>
						)}
					</>
				) : feed.error ? (
					<ErrorMessage
						look={feed.error === ErrorCode.NO_POSTS_FOR_ADDRESS ? ErrorMessageLook.INFO : undefined}
					>
						{feed.error === ErrorCode.NO_POSTS_FOR_ADDRESS ? (
							<>
								<b>No posts for this account.</b>
								<div>
									Your crypto account doesn't have any tokens or transactions that we can use to build
									the Feed for you. You can connect another account anytime.
								</div>
								<ActionButton
									look={ActionButtonLook.PRIMARY}
									onClick={() => connectAccount({ place: 'feed_no-posts-for-account' })}
								>
									Connect another account
								</ActionButton>
							</>
						) : (
							'Sorry, an error occured during feed loading. Please, try again later.'
						)}
					</ErrorMessage>
				) : feed.loading ? (
					<div className={css.loader}>
						<YlideLoader reason="Your feed is loading ..." />
					</div>
				) : (
					canLoadFeed || (
						<ErrorMessage look={ErrorMessageLook.INFO}>
							<div>
								You need to connect a crypto wallet in order to use <b>Smart feed</b> 🔥
							</div>
							<ActionButton
								look={ActionButtonLook.PRIMARY}
								onClick={() => connectAccount({ place: 'feed_no-accounts' })}
							>
								Connect account
							</ActionButton>
						</ErrorMessage>
					)
				)}
			</div>
		</NarrowContent>
	);
});

const VenomFeedContent = observer(() => {
	const location = useLocation();

	const { project } = useParams<{ project: VenomProjectId }>();
	invariant(project, 'Venom project must be specified');
	const projectMeta = venomProjectsMeta[project];

	const isAdminMode = !!matchPath(RoutePath.FEED_VENOM_ADMIN, location.pathname);

	const venomAccounts = useVenomAccounts();

	const [currentPost, setCurrentPost] = useState<number>(0);

	const postsQuery = useInfiniteQuery<DecodedVenomFeedPost[]>(['feed', 'venom', 'posts', project], {
		queryFn: async ({ pageParam = 0 }) => {
			analytics.venomFeedView(projectMeta.id);

			const posts = await VenomFilterApi.getPosts({
				feedId: projectMeta.feedId,
				beforeTimestamp: pageParam,
				adminMode: isAdminMode,
			});
			return posts.map(decodeVenomFeedPost);
		},
		getNextPageParam: lastPage =>
			lastPage.length ? lastPage[lastPage.length - 1].original.createTimestamp : undefined,
	});

	const messages = postsQuery.data?.pages.flat() || [];

	const [hasNewPosts, setHasNewPosts] = useState(false);

	useQuery(['feed', 'venom', 'new-posts', project], {
		queryFn: async () => {
			if (!postsQuery.isLoading) {
				const posts = await VenomFilterApi.getPosts({
					feedId: projectMeta.feedId,
					beforeTimestamp: 0,
					adminMode: isAdminMode,
				});
				setHasNewPosts(!!(posts.length && messages.length && posts[0].id !== messages[0].original.id));
			} else {
				setHasNewPosts(false);
			}
		},
		refetchInterval: 15 * 1000,
	});

	const serviceStatus = useQuery(['feed', 'venom', 'service-status'], {
		queryFn: async () => (await VenomFilterApi.getServiceStatus()).status,
		initialData: 'ACTIVE',
		refetchInterval: 10000,
	});

	const reloadFeed = () => {
		setHasNewPosts(false);
		setCurrentPost(0);
		postsQuery.remove();
		postsQuery.refetch();
	};

	const renderLoadingError = () => <ErrorMessage>Couldn't load posts.</ErrorMessage>;

	const createPostFormRef = useRef<CreatePostFormApi>(null);

	return (
		<NarrowContent contentClassName={css.venomProjecsContent}>
			<div className={css.venomProjectTitle}>
				<div className={css.venomProjectLogo}>{projectMeta.logo}</div>
				<div className={css.venomProjectName}>{projectMeta.name}</div>
				<div className={css.venomProjectDescription}>{projectMeta.description}</div>
			</div>

			{hasNewPosts && (
				<div className={css.newPostsButtonWrapper}>
					<ActionButton
						className={css.newPostsButton}
						look={ActionButtonLook.SECONDARY}
						onClick={() => reloadFeed()}
					>
						Load new posts
					</ActionButton>
				</div>
			)}

			<div className={css.divider} />

			{venomAccounts.length ? (
				<CreatePostForm
					ref={createPostFormRef}
					projectMeta={projectMeta}
					className={css.createPostForm}
					accounts={venomAccounts}
					isAnavailable={serviceStatus.data !== 'ACTIVE'}
					onCreated={() => toast('Good job! Your post will appear shortly 🔥')}
				/>
			) : (
				<ErrorMessage look={ErrorMessageLook.INFO}>
					<div>Connect your Venom wallet to post messages to Venom feed.</div>

					<ActionButton
						look={ActionButtonLook.PRIMARY}
						onClick={() => connectAccount({ place: 'venom-feed_no-accounts' })}
					>
						Connect account
					</ActionButton>
				</ErrorMessage>
			)}

			{/* <ErrorMessage look={ErrorMessageLook.INFO}>
				Venom Blockchain Is Under Maintenance: To stay informed about the latest developments and announcements,
				we encourage you to check Venom’s official social media channels.
			</ErrorMessage> */}

			<div className={css.divider} />

			<div className={css.posts}>
				{messages.length ? (
					<>
						{messages.map((message, idx) => (
							<VenomFeedPostItem
								key={idx}
								isFirstPost={idx === currentPost}
								post={message}
								onNextPost={() => setCurrentPost(idx + 1)}
								onReplyClick={() => {
									analytics.venomFeedReply(projectMeta.id, message.original.id);

									if (venomAccounts.length) {
										createPostFormRef.current?.replyTo(message);
									} else {
										toast('You need to connect a Venom account in order to reply 👍');
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
												analytics.venomFeedLoadMore(projectMeta.id);
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
		</NarrowContent>
	);
});

//

export const FeedPage = () => {
	const location = useLocation();
	const isVenomFeed = !!matchRoutes(
		[{ path: RoutePath.FEED_VENOM }, { path: RoutePath.FEED_VENOM_PROJECT }, { path: RoutePath.FEED_VENOM_ADMIN }],
		location.pathname,
	)?.length;

	return <GenericLayout>{isVenomFeed ? <VenomFeedContent /> : <RegularFeedContent />}</GenericLayout>;
};
