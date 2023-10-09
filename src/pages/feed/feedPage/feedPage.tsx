import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { useEffect, useMemo, useState } from 'react';
import { InView } from 'react-intersection-observer';
import { generatePath, useParams } from 'react-router-dom';

import { FeedManagerApi } from '../../../api/feedManagerApi';
import { FeedServerApi } from '../../../api/feedServerApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButton/ActionButton';
import { CoverageModal } from '../../../components/coverageModal/coverageModal';
import { ErrorMessage, ErrorMessageLook } from '../../../components/errorMessage/errorMessage';
import { NarrowContent } from '../../../components/genericLayout/content/narrowContent/narrowContent';
import { GenericLayout, useGenericLayoutApi } from '../../../components/genericLayout/genericLayout';
import { isOnboardingInProgress } from '../../../components/mainViewOnboarding/mainViewOnboarding';
import { SimpleLoader } from '../../../components/simpleLoader/simpleLoader';
import { AppMode, REACT_APP__APP_MODE, REACT_APP__VAPID_PUBLIC_KEY } from '../../../env';
import { ReactComponent as ArrowUpSvg } from '../../../icons/ic20/arrowUp.svg';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import { analytics } from '../../../stores/Analytics';
import domain from '../../../stores/Domain';
import { FeedStore } from '../../../stores/Feed';
import { feedSettings } from '../../../stores/FeedSettings';
import { DomainAccount } from '../../../stores/models/DomainAccount';
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

function enableNotifications(accounts: DomainAccount[]) {
	function subscribe() {
		navigator.serviceWorker
			.getRegistration()
			.then(registration => {
				function urlBase64ToUint8Array(base64String: string) {
					const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
					const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
					const rawData = atob(base64);
					const outputArray = new Uint8Array(rawData.length);
					for (let i = 0; i < rawData.length; ++i) {
						outputArray[i] = rawData.charCodeAt(i);
					}
					return outputArray;
				}

				return registration?.pushManager.subscribe({
					applicationServerKey: urlBase64ToUint8Array(REACT_APP__VAPID_PUBLIC_KEY!),
					userVisibleOnly: true,
				});
			})
			.then(
				subscription =>
					subscription &&
					Promise.all(accounts.map(a => FeedManagerApi.subscribe(a.mainViewKey, subscription))),
			);
	}

	navigator?.permissions?.query({ name: 'notifications' }).then(r => {
		if (r.state === 'prompt') {
			Notification.requestPermission().then(result => {
				if (result === 'granted') {
					subscribe();
				}
			});
		} else if (r.state === 'granted') {
			subscribe();
		}
	});
}

//

const FeedPageContent = observer(() => {
	const { tag, source, address } = useParams<{ tag: string; source: string; address: string }>();

	const navigate = useNav();
	const genericLayoutApi = useGenericLayoutApi();
	const tags = feedSettings.tags;

	const accounts = domain.accounts.activeAccounts;
	const mvAccounts = domain.accounts.mainViewAccounts;
	const selectedAccounts = useMemo(
		() => (address ? mvAccounts.filter(a => a.account.address === address) : !tag && !source ? mvAccounts : []),
		[mvAccounts, address, tag, source],
	);

	const onboarding = isOnboardingInProgress.get();

	useEffect(() => {
		if (address && !selectedAccounts.length) {
			navigate(generatePath(RoutePath.FEED));
		}
	}, [address, navigate, selectedAccounts]);

	const coverage = feedSettings.coverages.get(selectedAccounts[0]);
	const totalCoverage = useMemo(() => {
		if (!coverage || coverage === 'error' || coverage === 'loading') {
			return null;
		}
		return coverage.totalCoverage;
	}, [coverage]);
	const [showCoverageModal, setShowCoverageModal] = useState(false);

	useEffect(() => {
		// Check notifications on page load.
		// This will work on any device except iOS Safari,
		// where it's required to check notifications on user interaction.

		const clickListener = () => {
			document.body.removeEventListener('click', clickListener);
			enableNotifications(mvAccounts);
		};

		if (mvAccounts.length && !onboarding) {
			enableNotifications(mvAccounts);
			document.body.addEventListener('click', clickListener);
		}

		return () => {
			document.body.removeEventListener('click', clickListener);
		};
	}, [mvAccounts, onboarding]);

	// We can NOT load smart feed if no suitable account connected
	const canLoadFeed =
		!!tag ||
		(!!mvAccounts.length && (REACT_APP__APP_MODE !== AppMode.MAIN_VIEW || mvAccounts.length === accounts.length));

	const reloadCounter = reloadFeedCounter.get();

	const feed = useMemo(() => {
		hookDependency(reloadCounter);

		const feed = new FeedStore({
			// TODO: KONST
			tags: tags !== 'error' && tags !== 'loading' ? tags.filter(t => t.id === Number(tag)) : [],
			sourceId: source,
			addressTokens: mvAccounts.map(a => a.mainViewKey),
		});

		genericLayoutApi.scrollToTop();

		if (canLoadFeed) {
			feed.load();
		}

		return feed;
	}, [canLoadFeed, tags, tag, genericLayoutApi, mvAccounts, source, reloadCounter]);

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
		if (selectedAccounts.length === 1 && address) {
			return `Feed for ${
				selectedAccounts[0].name
					? selectedAccounts[0].name
					: truncateInMiddle(selectedAccounts[0].account.address, 8, '..')
			}`;
		}
		return 'Smart feed';
	}, [feed, selectedAccounts, address, tag]);

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
					{feed.tags.length === 0 &&
						!feed.sourceId &&
						selectedAccounts.length === 1 &&
						address &&
						totalCoverage && (
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
						{feed.posts.map(post => (
							<FeedPostItem key={post.id} isInFeed realtedAccounts={selectedAccounts} post={post} />
						))}

						{feed.moreAvailable && (
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
