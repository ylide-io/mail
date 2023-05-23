import { observer } from 'mobx-react';
import React, { useEffect, useMemo, useRef } from 'react';
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
import { useDomainAccounts } from '../../../stores/Domain';
import { FeedStore, getFeedCategoryName } from '../../../stores/Feed';
import { MailList } from '../../../stores/MailList';
import { RoutePath } from '../../../stores/routePath';
import { connectAccount } from '../../../utils/account';
import { useNav } from '../../../utils/url';
import { CreatePostForm } from '../components/createPostForm/createPostForm';
import { FeedPostItem } from '../components/feedPostItem/feedPostItem';
import css from './feedPage.module.scss';
import ErrorCode = FeedServerApi.ErrorCode;

function isInViewport(element: Element) {
	const rect = element.getBoundingClientRect();
	return rect.top >= -100 && rect.top <= (window.innerHeight || document.documentElement.clientHeight);
}

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

	const lastPostView = useRef<HTMLDivElement>(null);
	const feedBodyRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const timer = setInterval(async () => {
			if (lastPostView.current && isInViewport(lastPostView.current) && feed.moreAvailable) {
				await feed.loadMore();
			}
		}, 300);

		return () => clearInterval(timer);
	}, [feed]);

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

			<div className={css.feedBody} ref={feedBodyRef}>
				{feed.loaded ? (
					<>
						{feed.posts.map(post => (
							<FeedPostItem isInFeed post={post} key={post.id} />
						))}

						{feed.moreAvailable && (
							<div className={css.loader} ref={lastPostView}>
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
	const feed = useMemo(() => {
		return new MailList({ venom: { isVenom: true } });
	}, []);

	useEffect(() => () => feed.destroy(), [feed]);

	return (
		<NarrowContent title="Venom feed">
			<CreatePostForm />
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
