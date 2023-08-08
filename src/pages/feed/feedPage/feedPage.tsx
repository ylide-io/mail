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
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { AppMode, REACT_APP__APP_MODE } from '../../../env';
import { ReactComponent as ArrowUpSvg } from '../../../icons/ic20/arrowUp.svg';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import domain from '../../../stores/Domain';
import { FeedStore } from '../../../stores/Feed';
import { feedSettings } from '../../../stores/FeedSettings';
import { RoutePath } from '../../../stores/routePath';
import { connectAccount } from '../../../utils/account';
import { hookDependency } from '../../../utils/react';
import { truncateInMiddle } from '../../../utils/string';
import { useNav } from '../../../utils/url';
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
	const tags = feedSettings.tags;

	const [showCoverageModal, setShowCoverageModal] = useState(false);

	const { tag, source, address } = useParams<{ tag: string; source: string; address: string }>();

	const selectedAccounts = useMemo(
		() => (address ? accounts.filter(a => a.account.address === address) : !tag && !source ? accounts : []),
		[accounts, address, tag, source],
	);

	useEffect(() => {
		if (address && !selectedAccounts.length) {
			navigate(generatePath(RoutePath.FEED));
		}
	}, [address, navigate, selectedAccounts]);

	// We can NOT load smart feed if no suitable account connected
	const canLoadFeed =
		!!tag ||
		(!!accounts.length && (REACT_APP__APP_MODE !== AppMode.MAIN_VIEW || accounts.every(a => a.mainViewKey)));

	const reloadCounter = reloadFeedCounter.get();

	const feed = useMemo(() => {
		hookDependency(reloadCounter);

		const feed = new FeedStore({
			// TODO: KONST
			tags: tags !== 'error' && tags !== 'loading' ? tags.filter(t => t.id === Number(tag)) : [],
			sourceId: source,
			addressTokens: selectedAccounts.map(a => a.mainViewKey),
		});

		genericLayoutApi.scrollToTop();

		if (canLoadFeed) {
			feed.load();
		}

		return feed;
	}, [canLoadFeed, tags, tag, genericLayoutApi, selectedAccounts, source, reloadCounter]);

	const title = useMemo(() => {
		if (feed.tags.length === 1 && feed.tags[0].name) {
			return feed.sourceId;
		}
		if (selectedAccounts.length === 1) {
			return `Feed for ${
				selectedAccounts[0].name
					? selectedAccounts[0].name
					: truncateInMiddle(selectedAccounts[0].account.address, 8, '..')
			}`;
		}
		return 'Feed';
	}, [feed, selectedAccounts]);

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
				<>
					{!!feed.newPosts && (
						<ActionButton look={ActionButtonLook.SECONDARY} onClick={() => feed.loadNew()}>
							Show {feed.newPosts} new posts
						</ActionButton>
					)}
					{feed.tags.length === 0 && !feed.sourceId && selectedAccounts.length === 1 && (
						<ActionButton
							look={ActionButtonLook.PRIMARY}
							onClick={() => setShowCoverageModal(true)}
							style={{ marginLeft: '8px' }}
						>
							Status
						</ActionButton>
					)}
				</>
			}
		>
			{showCoverageModal && (
				<CoverageModal onClose={() => setShowCoverageModal(false)} account={selectedAccounts[0]} />
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
