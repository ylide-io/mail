import { IMessage } from '@ylide/sdk';
import { observer } from 'mobx-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery } from 'react-query';
import { generatePath, useLocation, useParams } from 'react-router-dom';

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
import { IMessageDecodedContent } from '../../../indexedDB/IndexedDB';
import { useDomainAccounts, useVenomAccounts } from '../../../stores/Domain';
import { FeedStore, getFeedCategoryName } from '../../../stores/Feed';
import { ILinkedMessage, MailList } from '../../../stores/MailList';
import { RoutePath } from '../../../stores/routePath';
import { connectAccount } from '../../../utils/account';
import { decodeBroadcastContent, decodeMessage } from '../../../utils/mail';
import { useIsInViewport } from '../../../utils/ui';
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
	const isAllPosts = location.pathname === generatePath(RoutePath.FEED_ALL);

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

	const loadingMoreRef = useRef(null);
	useIsInViewport({
		ref: loadingMoreRef,
		threshold: 100,
		callback: visible => visible && feed.loadMore(),
	});

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
							<div ref={loadingMoreRef} className={css.loader}>
								<YlideLoader reason="Loading more posts ..." />
							</div>
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

const useVenomChain = false;

let VenomFeedContent: ({ admin }: { admin: boolean }) => JSX.Element;

if (useVenomChain) {
	VenomFeedContent = observer(({ admin }: { admin: boolean }) => {
		const venomAccounts = useVenomAccounts();

		const [rebuildMailListCounter, setRebuildMailListCounter] = useState(1);
		const mailList = useMemo(() => {
			// Senceless code to make IDE treat this var as dependency
			isNaN(rebuildMailListCounter);

			const mailList = new MailList<{ message: ILinkedMessage; decoded: IMessageDecodedContent }>();

			mailList.init({
				messagesFilter: async messages => {
					const ids = messages.map(m => m.msgId);
					const { bannedPosts } = await VenomFilterApi.getPostsStatus({ ids });
					return messages.filter(m => !bannedPosts.includes(m.msgId));
				},
				messageHandler: async message => ({
					message,
					decoded: await decodeMessage(message.msgId, message.msg),
				}),
				venomFeed: true,
			});

			return mailList;
		}, [rebuildMailListCounter]);

		useEffect(() => () => mailList?.destroy(), [mailList]);

		const loadingMoreRef = useRef(null);
		useIsInViewport({
			ref: loadingMoreRef,
			threshold: 100,
			callback: visible => visible && mailList?.loadNextPage(),
		});

		const renderLoadingError = () => <ErrorMessage>Couldn't load posts.</ErrorMessage>;

		return (
			<NarrowContent title="Venom feed">
				{venomAccounts.length ? (
					<CreatePostForm
						className={css.createPostForm}
						accounts={venomAccounts}
						onCreated={() => setRebuildMailListCounter(i => i + 1)}
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
					{mailList?.messages.length ? (
						<>
							{mailList.messages.map(message => (
								<VenomFeedPostItem msg={message.message.msg} decoded={message.decoded} />
							))}

							{mailList.isError
								? renderLoadingError()
								: mailList.isNextPageAvailable && (
										<div ref={loadingMoreRef} className={css.loader}>
											<YlideLoader reason="Loading more posts ..." />
										</div>
								  )}
						</>
					) : mailList?.isLoading ? (
						<div className={css.loader}>
							<YlideLoader reason="Your feed is loading ..." />
						</div>
					) : mailList?.isError ? (
						renderLoadingError()
					) : (
						<ErrorMessage look={ErrorMessageLook.INFO}>No messages yet</ErrorMessage>
					)}
				</div>
			</NarrowContent>
		);
	});
} else {
	VenomFeedContent = observer(({ admin }: { admin: boolean }) => {
		const venomAccounts = useVenomAccounts();

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

		const reloadFeed = () => {
			setHasNewPosts(false);
			postsQuery.remove();
			postsQuery.refetch();
		};

		const loadingMoreRef = useRef(null);
		useIsInViewport({
			ref: loadingMoreRef,
			threshold: 100,
			callback: visible => visible && postsQuery.fetchNextPage(),
		});

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
							{messages.map(message => (
								<VenomFeedPostItem msg={message.msg} decoded={message.decoded} />
							))}

							{postsQuery.isError
								? renderLoadingError()
								: postsQuery.hasNextPage && (
										<div ref={loadingMoreRef} className={css.loader}>
											<YlideLoader reason="Loading more posts ..." />
										</div>
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
}

//

const FeedPageContent = observer(({ admin }: { admin: boolean }) => {
	const location = useLocation();
	const isVenomFeed =
		location.pathname === generatePath(RoutePath.FEED_VENOM) ||
		location.pathname === generatePath(RoutePath.FEED_VENOM_ADMIN);

	return isVenomFeed ? <VenomFeedContent admin={admin} /> : <RegularFeedContent />;
});

export const FeedPage = ({ admin = false }: { admin?: boolean }) => (
	<GenericLayout>
		<FeedPageContent admin={admin} />
	</GenericLayout>
);
