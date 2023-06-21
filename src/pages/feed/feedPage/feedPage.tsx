import { IMessage } from '@ylide/sdk';
import { observer } from 'mobx-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InView } from 'react-intersection-observer';
import { useInfiniteQuery, useQuery } from 'react-query';
import { generatePath, matchPath, useLocation, useParams } from 'react-router-dom';

import { FeedCategory, FeedServerApi } from '../../../api/feedServerApi';
import { VenomFilterApi } from '../../../api/venomFilterApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButton/ActionButton';
import { ErrorMessage, ErrorMessageLook } from '../../../components/errorMessage/errorMessage';
import { NarrowContent } from '../../../components/genericLayout/content/narrowContent/narrowContent';
import { GenericLayout, useGenericLayoutApi } from '../../../components/genericLayout/genericLayout';
import { toast } from '../../../components/toast/toast';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { AppMode, REACT_APP__APP_MODE } from '../../../env';
import { ReactComponent as ArrowUpSvg } from '../../../icons/ic20/arrowUp.svg';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import { useDomainAccounts, useVenomAccounts } from '../../../stores/Domain';
import { FeedStore, getFeedCategoryName } from '../../../stores/Feed';
import { RoutePath } from '../../../stores/routePath';
import { connectAccount } from '../../../utils/account';
import { decodeBroadcastContent } from '../../../utils/mail';
import { useNav } from '../../../utils/url';
import { CreatePostForm } from '../components/createPostForm/createPostForm';
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
								<ActionButton look={ActionButtonLook.PRIMARY} onClick={() => connectAccount()}>
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
							<ActionButton look={ActionButtonLook.PRIMARY} onClick={() => connectAccount()}>
								Connect account
							</ActionButton>
						</ErrorMessage>
					)
				)}
			</div>
		</NarrowContent>
	);
});

const VenomFeedContent = observer(({ admin }: { admin: boolean }) => {
	const venomAccounts = useVenomAccounts();

	const [currentPost, setCurrentPost] = useState<number>(0);

	const postsQuery = useInfiniteQuery(['feed', 'venom', 'load'], {
		queryFn: async ({ pageParam = 0 }) => {
			const posts = await VenomFilterApi.getPosts({ beforeTimestamp: pageParam, adminMode: admin });

			return posts.map(p => {
				const msg: IMessage = {
					...p.meta,
					key: new Uint8Array(p.meta.key),
				};
				return {
					original: p,
					msg,
					decoded: decodeBroadcastContent(
						msg.msgId,
						msg,
						p.content
							? p.content.corrupted
								? p.content
								: {
										...p.content,
										content: new Uint8Array(p.content.content),
								  }
							: null,
					),
				};
			});
		},
		getNextPageParam: lastPage =>
			lastPage.length ? lastPage[lastPage.length - 1].original.createTimestamp : undefined,
	});

	const messages = postsQuery.data?.pages.flat() || [];

	const [hasNewPosts, setHasNewPosts] = useState(false);

	useQuery(['feed', 'venom', 'new-posts'], {
		queryFn: async () => {
			if (!hasNewPosts) {
				const posts = await VenomFilterApi.getPosts({ beforeTimestamp: 0, adminMode: admin });
				setHasNewPosts(!!(posts.length && messages.length && posts[0].id !== messages[0].original.id));
			}
		},
		refetchInterval: 15 * 1000,
	});

	const [serviceStatus, setServiceStatus] = useState<string>('ACTIVE');

	const reloadServiceStatus = useCallback(async () => {
		const result = await VenomFilterApi.getServiceStatus();
		setServiceStatus(result.status);
	}, []);

	useEffect(() => {
		reloadServiceStatus();
		const timer = setInterval(reloadServiceStatus, 10000);
		return () => {
			clearInterval(timer);
		};
	}, [reloadServiceStatus]);

	const reloadFeed = () => {
		setHasNewPosts(false);
		setCurrentPost(0);
		postsQuery.remove();
		postsQuery.refetch();
	};

	const renderLoadingError = () => <ErrorMessage>Couldn't load posts.</ErrorMessage>;

	return (
		<NarrowContent
			title="Venom feed"
			titleRight={
				hasNewPosts && (
					<ActionButton look={ActionButtonLook.SECONDARY} onClick={() => reloadFeed()}>
						Load new posts
					</ActionButton>
				)
			}
		>
			{venomAccounts.length ? (
				<CreatePostForm
					className={css.createPostForm}
					accounts={venomAccounts}
					onCreated={() => toast('Good job! Your post will appear shortly 🔥')}
					serviceStatus={serviceStatus}
				/>
			) : (
				<ErrorMessage look={ErrorMessageLook.INFO}>
					<div>Connect your Venom wallet to post messages to Venom feed.</div>

					<ActionButton look={ActionButtonLook.PRIMARY} onClick={() => connectAccount()}>
						Connect account
					</ActionButton>
				</ErrorMessage>
			)}

			<div className={css.divider} />

			<div className={css.posts}>
				{messages.length ? (
					<>
						{messages.map((message, idx) => (
							<VenomFeedPostItem
								isFirstPost={idx === currentPost}
								msg={message.msg}
								decoded={message.decoded}
								onNextPost={() => setCurrentPost(idx + 1)}
							/>
						))}

						{postsQuery.isError
							? renderLoadingError()
							: postsQuery.hasNextPage && (
									<InView
										className={css.loader}
										rootMargin="100px"
										onChange={inView => inView && postsQuery.fetchNextPage()}
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

const FeedPageContent = observer(({ admin }: { admin: boolean }) => {
	const location = useLocation();
	const isVenomFeed =
		!!matchPath(RoutePath.FEED_VENOM, location.pathname) ||
		!!matchPath(RoutePath.FEED_VENOM_ADMIN, location.pathname);

	return isVenomFeed ? <VenomFeedContent admin={admin} /> : <RegularFeedContent />;
});

export const FeedPage = ({ admin = false }: { admin?: boolean }) => (
	<GenericLayout>
		<FeedPageContent admin={admin} />
	</GenericLayout>
);
