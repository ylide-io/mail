import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { useEffect, useMemo, useState } from 'react';
import { InView } from 'react-intersection-observer';
import { generatePath, useParams } from 'react-router-dom';

import { FeedServerApi } from '../../../api/feedServerApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButton/ActionButton';
import { CoverageModal } from '../../../components/coverageModal/coverageModal';
import { ErrorMessage, ErrorMessageLook } from '../../../components/errorMessage/errorMessage';
import { NarrowContent } from '../../../components/genericLayout/content/narrowContent/narrowContent';
import { GenericLayout, useGenericLayoutApi } from '../../../components/genericLayout/genericLayout';
import { SimpleLoader } from '../../../components/simpleLoader/simpleLoader';
import { ReactComponent as ArrowUpSvg } from '../../../icons/ic20/arrowUp.svg';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import { analytics } from '../../../stores/Analytics';
import domain from '../../../stores/Domain';
import { FeedStore } from '../../../stores/Feed';
import { RoutePath } from '../../../stores/routePath';
import { hookDependency } from '../../../utils/react';
import { truncateInMiddle } from '../../../utils/string';
import { useNav } from '../../../utils/url';
import { FeedPostItem } from '../_common/feedPostItem/feedPostItem';
import css from './feedPage.module.scss';
import ErrorCode = FeedServerApi.ErrorCode;
import { connectAccount, payAccount } from '../../../utils/account';
import { Paywall } from './paywall';

const reloadFeedCounter = observable.box(0);

export function reloadFeed() {
	reloadFeedCounter.set(reloadFeedCounter.get() + 1);
}

const FeedPageContent = observer(() => {
	const { tag, source, address } = useParams<{ tag: string; source: string; address: string }>();

	const navigate = useNav();
	const genericLayoutApi = useGenericLayoutApi();
	const tags = domain.feedSettings.tags;

	useEffect(() => {
		if (address && domain.account && domain.account.address !== address) {
			navigate(generatePath(RoutePath.FEED));
		}
	}, [address, navigate, domain.account]);

	const coverage = domain.account ? domain.feedSettings.coverages.get(domain.account) : undefined;
	const totalCoverage = useMemo(() => {
		if (!coverage || coverage === 'error' || coverage === 'loading') {
			return null;
		}
		return coverage.totalCoverage;
	}, [coverage]);
	const [showCoverageModal, setShowCoverageModal] = useState(false);

	const canLoadFeed = Boolean(tag || domain.account);

	const reloadCounter = reloadFeedCounter.get();

	const feedType = useMemo(() => {
		if (!tag && !address && !source) {
			return 'personal';
		} else {
			if (!tag && !source && address === domain.account?.address) {
				return 'personal';
			}
			return 'generic';
		}
	}, [tag, source, address, domain.account]);

	const feed = useMemo(() => {
		hookDependency(reloadCounter);

		const feed = new FeedStore({
			// TODO: KONST
			tags: tags !== 'error' && tags !== 'loading' ? tags.filter(t => t.id === Number(tag)) : [],
			sourceId: source,
			addressTokens: domain.account ? [domain.account.mainviewKey] : [],
		});

		genericLayoutApi.scrollToTop();

		if (canLoadFeed) {
			feed.load();
		}

		return feed;
	}, [canLoadFeed, tags, tag, genericLayoutApi, domain.account, source, reloadCounter]);

	useEffect(() => {
		return () => {
			feed.clearProcess();
		};
	}, [feed]);

	const title = useMemo(() => {
		if (tag) {
			return feed.tags.find(t => t.id === Number(tag))?.name;
		}
		if (feed.tags.length === 1 && feed.tags[0].name) {
			return feed.sourceId;
		}
		if (domain.account) {
			return `Feed for ${truncateInMiddle(domain.account.address, 8, '..')}`;
		}
		return 'Smart feed';
	}, [feed, domain.account, tag]);

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
					{feed.tags.length === 0 && !feed.sourceId && domain.account && address && totalCoverage && (
						<ActionButton
							look={ActionButtonLook.PRIMARY}
							onClick={() => {
								setShowCoverageModal(true);
								analytics.mainviewCoverageClick(address);
							}}
						>
							USD Coverage: {totalCoverage}
						</ActionButton>
					)}
				</div>
			}
		>
			{showCoverageModal && coverage && coverage !== 'error' && coverage !== 'loading' && (
				<CoverageModal onClose={() => setShowCoverageModal(false)} coverage={coverage} />
			)}
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
									<FeedPostItem feedType={feedType} key={post.id} post={post} />
								))}
								<Paywall />
							</>
						) : (
							feed.posts.map(post => <FeedPostItem feedType={feedType} key={post.id} post={post} />)
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
