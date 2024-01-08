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
import { SimpleLoader } from '../../../components/simpleLoader/simpleLoader';
import { REACT_APP__VAPID_PUBLIC_KEY } from '../../../env';
import { ReactComponent as ArrowUpSvg } from '../../../icons/ic20/arrowUp.svg';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import { analytics } from '../../../stores/Analytics';
import domain from '../../../stores/Domain';
import { FeedStore } from '../../../stores/Feed';
import { DomainAccount } from '../../../stores/models/DomainAccount';
import { RoutePath } from '../../../stores/routePath';
import { hookDependency } from '../../../utils/react';
import { truncateInMiddle } from '../../../utils/string';
import { useNav } from '../../../utils/url';
import { FeedPostItem } from '../_common/feedPostItem/feedPostItem';
import css from './feedPage.module.scss';
import ErrorCode = FeedServerApi.ErrorCode;
import { invariant } from '../../../utils/assert';
import { connectAccount, payAccount } from '../../../utils/account';

const reloadFeedCounter = observable.box(0);

export function reloadFeed() {
	reloadFeedCounter.set(reloadFeedCounter.get() + 1);
}

//

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
					Promise.all(accounts.map(a => FeedManagerApi.subscribe(a.mainviewKey, subscription))),
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

const PaywallRow = ({
	title,
	subtitle,
	text,
}: {
	title: React.ReactNode;
	subtitle: React.ReactNode;
	text: React.ReactNode;
}) => {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'flex-start',
				marginBottom: 40,
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					marginRight: 52,
					flexBasis: 135,
					flexGrow: 0,
					flexShrink: 0,
				}}
			>
				<div
					style={{
						textAlign: 'center',
						fontSize: '40px',
						fontStyle: 'normal',
						fontWeight: '400',
						lineHeight: '22px',
						marginBottom: 10,
					}}
				>
					{title}
				</div>
				<div
					style={{
						textAlign: 'center',
						fontSize: '15px',
						fontStyle: 'normal',
						fontWeight: '300',
						lineHeight: '22px',
					}}
				>
					{subtitle}
				</div>
			</div>
			<div
				style={{
					flexGrow: 1,
					flexShrink: 1,
					fontSize: '15px',
					fontStyle: 'normal',
					fontWeight: '300',
					lineHeight: '22px',
				}}
			>
				{text}
			</div>
		</div>
	);
};

const TrialHasEnded = observer(() => {
	return (
		<ErrorMessage look={ErrorMessageLook.INFO}>
			<div>Your trial period has ended. You need to activate paid accout to keed reading Mainview.</div>
			<ActionButton look={ActionButtonLook.PRIMARY} onClick={() => connectAccount({ place: 'feed_no-accounts' })}>
				Activate paid account
			</ActionButton>
		</ErrorMessage>
	);
});

const Paywall = observer(({ type = 'generic' }: { type?: 'generic' | 'smart-feed' }) => {
	const toPay = !!domain.account;
	return (
		<div
			style={{
				borderRadius: type === 'generic' ? '0px 0px 10px 10px' : 10,
				background:
					type === 'generic'
						? 'linear-gradient(180deg, rgba(220, 224, 226, 0.00) 0%, #DCE0E2 8.85%)'
						: '#DCE0E2',
				paddingTop: type === 'generic' ? 100 : 50,
				paddingBottom: 20,
				paddingLeft: 50,
				paddingRight: 50,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'flex-start',
				marginTop: type === 'generic' ? -70 : 0,
				position: 'relative',
				zIndex: 3,
			}}
		>
			<PaywallRow
				title="4,500+"
				subtitle="news sources"
				text={
					<>
						Mainview scans <b style={{ fontWeight: '700' }}>4,500+ news sources</b> in realtime: Twitter,
						Telegram, Discord, Mirror, etc.
					</>
				}
			/>
			<PaywallRow
				title="1 mln+"
				subtitle="posts processed"
				text={
					<>
						We've processed <b style={{ fontWeight: '700' }}>1 million+ posts</b> about crypto to learn how
						to personalise and prioritise news for you
					</>
				}
			/>
			<PaywallRow
				title="10,653"
				subtitle="crypto projects"
				text={
					<>
						We track <b style={{ fontWeight: '700' }}>10,000+ crypto projects</b>: from the largest to the
						smallest - we've got you covered
					</>
				}
			/>
			<div
				style={{
					textAlign: 'center',
					fontSize: '17px',
					fontStyle: 'normal',
					fontWeight: toPay ? '600' : '400',
					lineHeight: '26px',
					marginBottom: 26,
				}}
			>
				{toPay
					? `Your trial period has ended. You need to activate paid accout to keed reading Mainview.`
					: `Login to access your personal feed and get unlimited access to prebuilt feeds`}
			</div>
			<ActionButton
				size={ActionButtonSize.LARGE}
				look={ActionButtonLook.PRIMARY}
				onClick={() => (toPay ? payAccount({ place: 'paywall' }) : connectAccount({ place: 'paywall' }))}
			>
				{toPay ? `Activate paid account` : `Connect wallet`}
			</ActionButton>
		</div>
	);
});

//

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

	useEffect(() => {
		// Check notifications on page load.
		// This will work on any device except iOS Safari,
		// where it's required to check notifications on user interaction.

		const clickListener = () => {
			document.body.removeEventListener('click', clickListener);
			enableNotifications([domain.account!]);
		};

		if (domain.account) {
			enableNotifications([domain.account]);
			document.body.addEventListener('click', clickListener);
		}

		return () => {
			document.body.removeEventListener('click', clickListener);
		};
	}, [domain.account]);

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
