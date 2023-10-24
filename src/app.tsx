import { IObservableValue } from 'mobx';
import { observer } from 'mobx-react';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { generatePath, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';

import css from './app.module.scss';
import { ActionButton, ActionButtonLook, ActionButtonSize } from './components/ActionButton/ActionButton';
import { IosInstallPwaPopup } from './components/iosInstallPwaPopup/iosInstallPwaPopup';
import { MainViewOnboarding } from './components/mainViewOnboarding/mainViewOnboarding';
import { PageMeta } from './components/pageMeta/pageMeta';
import { PopupManager } from './components/popup/popupManager/popupManager';
import { StaticComponentManager } from './components/staticComponentManager/staticComponentManager';
import { ToastManager } from './components/toast/toast';
import { TransactionPopup } from './components/TransactionPopup/TransactionPopup';
import { YlideLoader } from './components/ylideLoader/ylideLoader';
import { APP_NAME } from './constants';
import { AppMode, REACT_APP__APP_MODE } from './env';
import { AdminFeedPage } from './pages/AdminFeedPage';
import { AdminPage } from './pages/AdminPage';
import { CommunityPage } from './pages/community/communityPage/communityPage';
import { CommunityPostPage } from './pages/community/communityPostPage/communityPostPage';
import { ExplorePage } from './pages/explore/explorePage';
import { FeedPage } from './pages/feed/feedPage/feedPage';
import { FeedPostPage } from './pages/feed/feedPostPage/feedPostPage';
import { ComposePage } from './pages/mail/composePage/composePage';
import { ContactListPage } from './pages/mail/contactsPage/contactListPage';
import { ContactTagsPage } from './pages/mail/contactsPage/contactTagsPage';
import { MailboxPage } from './pages/mail/mailboxPage/mailboxPage';
import { MailDetailsPage } from './pages/mail/mailDetailsPage/mailDetailsPage';
import { OtcAssetsPage } from './pages/otc/OtcAssetsPage/OtcAssetsPage';
import { OtcChatPage } from './pages/otc/OtcChatPage/OtcChatPage';
import { OtcChatsPage } from './pages/otc/OtcChatsPage/OtcChatsPage';
import { OtcWalletsPage } from './pages/otc/OtcWalletsPage/OtcWalletsPage';
import { SettingsPage } from './pages/settings/settingsPage';
import { TestPage } from './pages/test/testPage';
import { WalletsPage } from './pages/wallets/walletsPage';
import { MailboxWidget } from './pages/widgets/mailboxWidget/mailboxWidget';
import { SendMessageWidget } from './pages/widgets/sendMessageWidget/sendMessageWidget';
import { ServiceWorkerUpdateCallback } from './serviceWorkerRegistration';
import { analytics } from './stores/Analytics';
import { browserStorage } from './stores/browserStorage';
import domain from './stores/Domain';
import { FolderId } from './stores/MailList';
import { NewMailNotifier } from './stores/newMailChecker';
import { RoutePath } from './stores/routePath';
import { enableRemoteConsole, remoteConsoleChannel } from './utils/dev';
import { openInNewWidnow } from './utils/misc';
import { PushNotificationsEnabler } from './utils/pushNotifications';
import { captureSentryExceptionWithId } from './utils/sentry';
import { useIsMatchesPattern, useNav } from './utils/url';

export enum AppTheme {
	V1 = 'v1',
	V2 = 'v2',
}

//

interface RedirectProps {
	from: string;
	to: string;
}

function redirect({ from, to }: RedirectProps) {
	return <Route path={from} element={<Navigate replace to={to} />} />;
}

//

interface AppProps {
	serviceWorkerUpdateCallback: IObservableValue<ServiceWorkerUpdateCallback | undefined>;
}

export const App = observer(({ serviceWorkerUpdateCallback }: AppProps) => {
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const navigate = useNav();

	const swUpdateCallback = serviceWorkerUpdateCallback.get();

	const [queryClient] = useState(
		new QueryClient({
			defaultOptions: {
				queries: {
					cacheTime: 0,
					staleTime: Infinity,
					retry: false,
					refetchOnWindowFocus: false,
				},
			},
		}),
	);

	useEffect(() => {
		document.documentElement.dataset.theme = REACT_APP__APP_MODE === AppMode.MAIN_VIEW ? AppTheme.V2 : AppTheme.V1;
	}, []);

	const [initErrorId, setInitErrorId] = useState('');

	const isTestPage = useIsMatchesPattern(RoutePath.TEST);

	useEffect(() => {
		if (!isTestPage) {
			const start = Date.now();
			domain
				.init()
				.catch(err => {
					const errorId = captureSentryExceptionWithId('Initialization error', err);
					setInitErrorId(errorId);
				})
				.finally(() => console.debug(`Initialization took ${Date.now() - start}ms`));
		}
	}, [isTestPage]);

	useEffect(() => {
		analytics.pageView(location.pathname);
	}, [location.pathname]);

	useEffect(() => {
		// enable admin mode
		const adminParam = searchParams.get('admin');
		if (adminParam) {
			browserStorage.adminPassword = adminParam.startsWith('yldpwd') ? adminParam : undefined;
			searchParams.delete('admin');
			return navigate(
				{
					path: location.pathname,
					search: searchParams,
					hash: location.hash,
				},
				{
					replace: true,
				},
			);
		}

		// enable remote console
		const consoleReParam = searchParams.get('cre');
		if (consoleReParam != null) {
			enableRemoteConsole();

			searchParams.delete('cre');
			return navigate(
				{
					path: location.pathname,
					search: searchParams,
					hash: location.hash,
				},
				{
					replace: true,
				},
			);
		}
	});

	if (initErrorId) {
		return (
			<div
				style={{
					display: 'grid',
					alignContent: 'center',
					justifyItems: 'center',
					gridGap: 20,
					paddingBottom: '10vh',
					width: '100vw',
					height: '100vh',
					fontSize: 18,
				}}
			>
				<div>
					Initialization error <span style={{ opacity: 0.5 }}>[{initErrorId}]</span>
				</div>

				<ActionButton size={ActionButtonSize.MEDIUM} onClick={() => window.location.reload()}>
					Try again
				</ActionButton>
			</div>
		);
	}

	if (!isTestPage && !domain.initialized) {
		return (
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					paddingBottom: '10vh',
					width: '100vw',
					height: '100vh',
				}}
			>
				<YlideLoader reason="Loading your account data from blockchain ..." />
			</div>
		);
	}

	return (
		<>
			<PushNotificationsEnabler />

			<PageMeta
				title={
					{
						[AppMode.HUB]: 'Ylide Social Hub: Web3 Community Chats Powered by Ylide Protocol',
						[AppMode.OTC]: 'OTC Trading Powered by Ylide Protocol',
						[AppMode.MAIN_VIEW]: 'MainView: Your Smart News Feed',
					}[REACT_APP__APP_MODE]
				}
				description={
					{
						[AppMode.HUB]:
							'Ylide Social Hub is a web3 social app powered by the Ylide protocol. Connect your digital wallet and join community spaces for diverse web3 topics. Engage in public chats, connect with web3 projects, and experience the future of decentralized communication.',
						[AppMode.OTC]: '',
						[AppMode.MAIN_VIEW]:
							'Master your crypto portfolio with our smart news feed. Follow tailored news based on your token holdings and DeFi positions. Stay focused on what matters most.',
					}[REACT_APP__APP_MODE]
				}
			/>

			{swUpdateCallback && (
				<div className={css.updateAppBanner}>
					<div>
						<b>A new version of {APP_NAME} is available!</b>
						<br />
						Please refresh the page to apply changes.
					</div>

					<ActionButton look={ActionButtonLook.HEAVY} onClick={() => swUpdateCallback()}>
						Update app 🚀
					</ActionButton>
				</div>
			)}

			{!!remoteConsoleChannel.get() && (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: '1fr auto',
						alignItems: 'center',
						gridGap: 8,
						padding: 8,
						color: '#fff',
						background: '#000',
					}}
				>
					<div>Remote console enabled</div>

					<ActionButton
						style={{ color: '#fff' }}
						look={ActionButtonLook.LITE}
						onClick={() => openInNewWidnow(`https://console.re/${remoteConsoleChannel.get()}`)}
					>
						Open
					</ActionButton>
				</div>
			)}

			<QueryClientProvider client={queryClient}>
				<PopupManager>
					<Routes>
						{/* GENERAL */}

						<Route path={RoutePath.ROOT} element={<ExplorePage />} />

						<Route path={RoutePath.TEST} element={<TestPage />} />
						<Route path={RoutePath.WALLETS} element={<WalletsPage />} />
						<Route path={RoutePath.SETTINGS} element={<SettingsPage />} />
						<Route path={RoutePath.ADMIN} element={<AdminPage />} />
						<Route path={RoutePath.ADMIN_FEED} element={<AdminFeedPage />} />

						{/* FEED */}

						{redirect({
							from: RoutePath.FEED,
							to: REACT_APP__APP_MODE === AppMode.MAIN_VIEW ? RoutePath.FEED_SMART : RoutePath.PROJECT,
						})}

						<Route path={RoutePath.FEED_ALL} element={<FeedPage />} />
						<Route path={RoutePath.FEED_POST_ID} element={<FeedPostPage />} />
						<Route path={RoutePath.FEED_CATEGORY_ID} element={<FeedPage />} />
						<Route path={RoutePath.FEED_SOURCE_ID} element={<FeedPage />} />
						<Route path={RoutePath.FEED_SMART} element={<FeedPage />} />
						<Route path={RoutePath.FEED_SMART_ADDRESS} element={<FeedPage />} />

						{/* PROJECTS */}

						{redirect({
							from: RoutePath.PROJECT,
							to: RoutePath.ROOT,
						})}

						<Route path={RoutePath.PROJECT_ID} element={<CommunityPage />} />
						<Route path={RoutePath.PROJECT_ID_OFFICIAL} element={<CommunityPage />} />
						<Route path={RoutePath.PROJECT_ID_OFFICIAL_ADMIN} element={<CommunityPostPage />} />
						<Route path={RoutePath.PROJECT_ID_DISCUSSION} element={<CommunityPage />} />
						<Route path={RoutePath.PROJECT_ID_DISCUSSION_ADMIN} element={<CommunityPage />} />
						<Route path={RoutePath.POST_ID} element={<CommunityPostPage />} />

						{/* MAIL */}

						{redirect({
							from: RoutePath.MAIL,
							to: generatePath(RoutePath.MAIL_FOLDER, {
								folderId: FolderId.Inbox,
							}),
						})}

						<Route path={RoutePath.MAIL_COMPOSE} element={<ComposePage />} />
						<Route path={RoutePath.MAIL_CONTACTS} element={<ContactListPage />} />
						<Route path={RoutePath.MAIL_CONTACT_TAGS} element={<ContactTagsPage />} />
						<Route path={RoutePath.MAIL_FOLDER} element={<MailboxPage />}>
							<Route path={RoutePath.MAIL_DETAILS_OUTLET} element={<MailDetailsPage />} />
						</Route>

						{/* OTC */}

						{redirect({
							from: RoutePath.OTC,
							to: RoutePath.OTC_ASSETS,
						})}

						<Route path={RoutePath.OTC_ASSETS} element={<OtcAssetsPage />} />
						<Route path={RoutePath.OTC_WALLETS} element={<OtcWalletsPage />} />
						<Route path={RoutePath.OTC_CHATS} element={<OtcChatsPage />} />
						<Route path={RoutePath.OTC_CHATS_ID} element={<OtcChatPage />} />

						{/* WIDGETS */}

						<Route path={RoutePath.WIDGET_SENDMESSAGE} element={<SendMessageWidget />} />
						<Route path={RoutePath.WIDGET_MAILBOX} element={<MailboxWidget />} />

						{/* REST */}

						{redirect({
							from: RoutePath.ANY,
							to:
								REACT_APP__APP_MODE === AppMode.OTC
									? RoutePath.OTC_ASSETS
									: REACT_APP__APP_MODE === AppMode.MAIN_VIEW
									? RoutePath.FEED
									: RoutePath.ROOT,
						})}
					</Routes>

					{domain.txPlateVisible && REACT_APP__APP_MODE !== AppMode.MAIN_VIEW && <TransactionPopup />}

					<StaticComponentManager />
					<ToastManager />

					{REACT_APP__APP_MODE === AppMode.MAIN_VIEW && <MainViewOnboarding />}

					<IosInstallPwaPopup />
					<NewMailNotifier />
				</PopupManager>
			</QueryClientProvider>
		</>
	);
});