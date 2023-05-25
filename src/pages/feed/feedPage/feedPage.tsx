import { observer } from 'mobx-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { generatePath, useLocation, useParams } from 'react-router-dom';

import { FeedCategory, FeedServerApi } from '../../../api/feedServerApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButton/ActionButton';
import { ErrorMessage, ErrorMessageLook } from '../../../components/errorMessage/errorMessage';
import { NarrowContent } from '../../../components/genericLayout/content/narrowContent/narrowContent';
import { GenericLayout, useGenericLayoutApi } from '../../../components/genericLayout/genericLayout';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { AppMode, REACT_APP__APP_MODE } from '../../../env';
import { ReactComponent as ArrowUpSvg } from '../../../icons/ic20/arrowUp.svg';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import { useDomainAccounts, useVenomAccounts } from '../../../stores/Domain';
import { FeedStore, getFeedCategoryName } from '../../../stores/Feed';
import { MailList } from '../../../stores/MailList';
import { RoutePath } from '../../../stores/routePath';
import { connectAccount } from '../../../utils/account';
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
	const selectedAccount = accounts.find(a => a.account.address === address);

	useEffect(() => {
		if (address && !selectedAccount) {
			navigate(generatePath(RoutePath.FEED));
		}
	}, [address, navigate, selectedAccount]);

	// We can NOT load smart feed if no suitable account connected
	const canLoadFeed =
		!!category ||
		isAllPosts ||
		(!!accounts.length && (REACT_APP__APP_MODE !== AppMode.MAIN_VIEW || accounts.every(a => a.mainViewKey)));

	const feed = useMemo(() => {
		const feed = new FeedStore({
			categories: category ? [category] : isAllPosts ? Object.values(FeedCategory) : undefined,
			sourceId: source,
			addressTokens: selectedAccount
				? [selectedAccount.mainViewKey]
				: !category && !source && !isAllPosts
				? accounts.map(a => a.mainViewKey)
				: undefined,
		});

		genericLayoutApi.scrollToTop();

		if (canLoadFeed) {
			feed.load();
		}

		return feed;
	}, [accounts, canLoadFeed, category, genericLayoutApi, isAllPosts, selectedAccount, source]);

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
							<FeedPostItem isInFeed post={post} key={post.id} />
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

const VenomFeedContent = observer(() => {
	const venomAccounts = useVenomAccounts();

	const [rebuildMailListCounter, setRebuildMailListCounter] = useState(1);
	const mailList = useMemo(() => {
		// Senceless code to make IDE treat this var as dependency
		isNaN(rebuildMailListCounter);

		if (!venomAccounts.length) return;

		const mailList = new MailList();

		mailList.init({ venomFeed: { account: venomAccounts[0] } });

		return mailList;
	}, [rebuildMailListCounter, venomAccounts]);

	useEffect(() => () => mailList?.destroy(), [mailList]);

	return (
		<NarrowContent title="Venom feed">
			<CreatePostForm onCreated={() => setRebuildMailListCounter(i => i + 1)} />

			<div className={css.divider} />

			<div className={css.posts}>
				{mailList?.messages.length ? (
					mailList.messages.map(message => <VenomFeedPostItem message={message} />)
				) : mailList?.isLoading ? (
					<div className={css.loader}>
						<YlideLoader reason="Your feed is loading ..." />
					</div>
				) : (
					<ErrorMessage look={ErrorMessageLook.INFO}>No messages yet</ErrorMessage>
				)}
			</div>
		</NarrowContent>
	);
});

//

const FeedPageContent = observer(() => {
	const location = useLocation();
	const isVenomFeed = location.pathname === generatePath(RoutePath.FEED_VENOM);

	return isVenomFeed ? <VenomFeedContent /> : <RegularFeedContent />;
});

export const FeedPage = () => (
	<GenericLayout>
		<FeedPageContent />
	</GenericLayout>
);
