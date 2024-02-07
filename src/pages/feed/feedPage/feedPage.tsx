import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { useEffect, useMemo } from 'react';
import { InView } from 'react-intersection-observer';
import { generatePath, useParams } from 'react-router-dom';

import { FeedServerApi } from '../../../api/feedServerApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButton/ActionButton';
import { ErrorMessage, ErrorMessageLook } from '../../../components/errorMessage/errorMessage';
import { NarrowContent } from '../../../components/genericLayout/content/narrowContent/narrowContent';
import { GenericLayout, useGenericLayoutApi } from '../../../components/genericLayout/genericLayout';
import { SimpleLoader } from '../../../components/simpleLoader/simpleLoader';
import { ReactComponent as ArrowUpSvg } from '../../../icons/ic20/arrowUp.svg';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import domain from '../../../stores/Domain';
import { FeedStore } from '../../../stores/Feed';
import { RoutePath } from '../../../stores/routePath';
import { hookDependency } from '../../../utils/react';
import { useNav } from '../../../utils/url';
import { FeedPostItem } from '../_common/feedPostItem/feedPostItem';
import css from './feedPage.module.scss';
import ErrorCode = FeedServerApi.ErrorCode;
import { connectAccount } from '../../../utils/account';
import { Paywall } from './paywall';

const reloadFeedCounter = observable.box(0);

export function reloadFeed() {
	reloadFeedCounter.set(reloadFeedCounter.get() + 1);
}

const FeedPageContent = observer(() => {
	const { tag, source, feedId } = useParams<{ tag: string; source: string; feedId: string }>();

	const navigate = useNav();
	const genericLayoutApi = useGenericLayoutApi();

	const canLoadFeed = Boolean(tag || domain.account);

	const reloadCounter = reloadFeedCounter.get();

	const feedDescriptor: FeedServerApi.FeedDescriptor = useMemo(
		() =>
			tag
				? {
						type: 'tags',
						tags: [Number(tag)],
				  }
				: source
				? {
						type: 'source',
						sourceId: Number(source),
				  }
				: {
						type: 'feed',
						feedId: feedId || 'default',
				  },
		[tag, source, feedId],
	);

	const finalFeedId =
		feedDescriptor.type === 'feed'
			? feedId === 'default'
				? domain.account?.defaultFeedId || null
				: feedId
			: undefined;
	const feedData = finalFeedId ? domain.feedsRepository.feedDataById.get(finalFeedId) : null;

	const feed = useMemo(() => {
		hookDependency(reloadCounter);

		const feed = new FeedStore(feedDescriptor);

		genericLayoutApi.scrollToTop();

		if (canLoadFeed) {
			feed.load();
		}

		return feed;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reloadCounter, feedDescriptor, genericLayoutApi, canLoadFeed, feedData]);

	useEffect(() => {
		return () => {
			feed.stopNewPostsChecking();
		};
	}, [feed]);

	const { affinity, title } = useMemo(() => {
		if (tag && Array.isArray(domain.feedsRepository.tags)) {
			return {
				affinity: 'external',
				title: domain.feedsRepository.tags.find(t => t.id === Number(tag))?.name || 'Feed for tag',
			};
		}
		if (source) {
			return {
				affinity: 'external',
				title: domain.feedSources.sourcesMap.get(Number(source))?.name || 'Feed for exact source',
			};
		}
		if (feedId) {
			const defFeed = feedId === domain.account?.defaultFeedId;
			const feedData = domain.feedsRepository.feedDataById.get(feedId);

			let name;
			if (!feedData) {
				name = defFeed ? 'Smart feed' : 'Loading...';
			} else {
				name = feedData.feed.name;
			}

			return { affinity: feedId, title: name };
		} else {
			const defFeedId = domain.account?.defaultFeedId;
			if (defFeedId) {
				const feedData = domain.feedsRepository.feedDataById.get(defFeedId);
				if (feedData) {
					return { affinity: defFeedId, title: feedData.feed.name };
				} else {
					return { affinity: defFeedId, title: 'Smart feed' };
				}
			} else {
				return { affinity: 'default', title: 'Smart feed' };
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tag, source, feedId, domain.account, domain.feedsRepository.tags, domain.feedSources.sourcesMap]);

	return (
		<NarrowContent
			title={title}
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
				<div className={css.buttons}>
					{!!feed.newPosts && (
						<ActionButton look={ActionButtonLook.SECONDARY} onClick={() => feed.loadNew()}>
							Show {feed.newPosts} new posts
						</ActionButton>
					)}
					{/* {feed.tags.length === 0 && !feed.sourceId && domain.account && address && totalCoverage && (
						<ActionButton
							look={ActionButtonLook.PRIMARY}
							onClick={() => {
								setShowCoverageModal(true);
								analytics.mainviewCoverageClick(address);
							}}
						>
							USD Coverage: {totalCoverage}
						</ActionButton>
					)} */}
				</div>
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
						{feed.posts.length === 0 && <h2>No posts in this category.</h2>}
						{domain.isTooMuch ? (
							<>
								{feed.posts.slice(0, 15).map(post => (
									<FeedPostItem affinity={affinity} feedId={feedId} key={post.id} post={post} />
								))}
								<Paywall />
							</>
						) : (
							feed.posts.map(post => (
								<FeedPostItem affinity={affinity} feedId={feedId} key={post.id} post={post} />
							))
						)}

						{!domain.isTooMuch && feed.moreAvailable && (
							<InView
								className={css.loader}
								rootMargin="100px"
								onChange={inView => inView && feed.loadMore()}
							>
								<SimpleLoader />
							</InView>
						)}
					</>
				) : feed.error ? (
					feed.error === ErrorCode.NO_POSTS_FOR_ADDRESS && !domain.isAccountActive ? (
						<Paywall type="smart-feed" />
					) : (
						<ErrorMessage
							look={feed.error === ErrorCode.NO_POSTS_FOR_ADDRESS ? ErrorMessageLook.INFO : undefined}
						>
							{feed.error === ErrorCode.NO_POSTS_FOR_ADDRESS ? (
								<>
									<b>No posts for this account.</b>
									<div>
										Your crypto account doesn't have any tokens or transactions that we can use to
										build the Feed for you. You can connect another account anytime.
									</div>
								</>
							) : (
								'Sorry, an error occured during feed loading. Please, try again later.'
							)}
						</ErrorMessage>
					)
				) : feed.loading ? (
					<div className={css.loader}>
						<SimpleLoader />
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
								Connect wallet
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
