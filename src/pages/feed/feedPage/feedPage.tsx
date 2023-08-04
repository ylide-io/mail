import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { useEffect, useMemo } from 'react';
import { InView } from 'react-intersection-observer';
import { generatePath, useParams } from 'react-router-dom';

import { FeedCategory, FeedServerApi, TagToCategoryName } from '../../../api/feedServerApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButton/ActionButton';
import { ErrorMessage, ErrorMessageLook } from '../../../components/errorMessage/errorMessage';
import { NarrowContent } from '../../../components/genericLayout/content/narrowContent/narrowContent';
import { GenericLayout, useGenericLayoutApi } from '../../../components/genericLayout/genericLayout';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { AppMode, REACT_APP__APP_MODE } from '../../../env';
import { ReactComponent as ArrowUpSvg } from '../../../icons/ic20/arrowUp.svg';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import domain from '../../../stores/Domain';
import { FeedStore } from '../../../stores/Feed';
import { RoutePath } from '../../../stores/routePath';
import { connectAccount } from '../../../utils/account';
import { hookDependency } from '../../../utils/react';
import { useIsMatchingRoute, useNav } from '../../../utils/url';
import { FeedPostItem } from '../_common/feedPostItem/feedPostItem';
import css from './feedPage.module.scss';
import ErrorCode = FeedServerApi.ErrorCode;

const reloadFeedCounter = observable.box(0);

export function reloadFeed() {
	reloadFeedCounter.set(reloadFeedCounter.get() + 1);
}

//

const FeedPageContent = observer(() => {
	const navigate = useNav();
	const accounts = domain.accounts.activeAccounts;
	const genericLayoutApi = useGenericLayoutApi();

	const { category, source, address } = useParams<{ category: FeedCategory; source: string; address: string }>();
	const isAllPosts = useIsMatchingRoute(RoutePath.FEED_ALL);

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

	const reloadCounter = reloadFeedCounter.get();

	const feed = useMemo(() => {
		hookDependency(reloadCounter);

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
	}, [canLoadFeed, category, genericLayoutApi, isAllPosts, selectedAccounts, source, reloadCounter]);

	return (
		<NarrowContent
			title={
				feed.tags.length === 1
					? TagToCategoryName[feed.tags[0]]
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

export function FeedPage() {
	return (
		<GenericLayout>
			<FeedPageContent />
		</GenericLayout>
	);
}
