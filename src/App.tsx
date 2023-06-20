import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { generatePath, matchPath, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';

import { ActionButton, ActionButtonLook, ActionButtonSize } from './components/ActionButton/ActionButton';
import { MainViewOnboarding } from './components/mainViewOnboarding/mainViewOnboarding';
import { PopupManager } from './components/popup/popupManager/popupManager';
import { StaticComponentManager } from './components/staticComponentManager/staticComponentManager';
import { ToastManager } from './components/toast/toast';
import { TransactionPopup } from './components/TransactionPopup/TransactionPopup';
import { YlideLoader } from './components/ylideLoader/ylideLoader';
import { APP_NAME } from './constants';
import { AppMode, REACT_APP__APP_MODE } from './env';
import { ReactComponent as CrossSvg } from './icons/ic20/cross.svg';
import { AdminFeedPage } from './pages/AdminFeedPage';
import { AdminPage } from './pages/AdminPage';
import { FeedPage } from './pages/feed/feedPage/feedPage';
import { FeedPostPage } from './pages/feed/feedPostPage/feedPostPage';
import { ComposePage } from './pages/mail/composePage/composePage';
import { ContactListPage } from './pages/mail/contactsPage/contactListPage';
import { ContactTagsPage } from './pages/mail/contactsPage/contactTagsPage';
import { MailboxPage } from './pages/mail/mailboxPage/mailboxPage';
import { MailDetailsPage } from './pages/mail/mailDetailsPage/mailDetailsPage';
import { NewWalletsPage } from './pages/NewWalletsPage';
import { OtcAssetsPage } from './pages/otc/OtcAssetsPage/OtcAssetsPage';
import { OtcChatPage } from './pages/otc/OtcChatPage/OtcChatPage';
import { OtcChatsPage } from './pages/otc/OtcChatsPage/OtcChatsPage';
import { OtcWalletsPage } from './pages/otc/OtcWalletsPage/OtcWalletsPage';
import { SettingsPage } from './pages/SettingsPage/SettingsPage';
import { TestPage } from './pages/TestPage/TestPage';
import { MailboxWidget } from './pages/widgets/mailboxWidget/mailboxWidget';
import { SendMessageWidget } from './pages/widgets/sendMessageWidget/sendMessageWidget';
import { analytics } from './stores/Analytics';
import { browserStorage } from './stores/browserStorage';
import domain from './stores/Domain';
import { RoutePath } from './stores/routePath';
import walletConnect from './stores/WalletConnect';
import { useNav } from './utils/url';

export enum AppTheme {
	V1 = 'v1',
	V2 = 'v2',
}

const RemoveTrailingSlash = () => {
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const navigate = useNav();

	useEffect(() => {
		const adminParam = searchParams.get('admin');

		if (location.pathname.match('/.*/$')) {
			navigate(
				{
					path: location.pathname.replace(/\/+$/, ''),
					search: location.search,
					hash: location.hash,
				},
				{
					replace: true,
				},
			);
		} else if (adminParam) {
			browserStorage.isUserAdmin = adminParam.startsWith('yldpwd');
			browserStorage.userAdminPassword = adminParam;
			searchParams.delete('admin');
			navigate(
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

	return <></>;
};

const App = observer(() => {
	const location = useLocation();

	const [queryClient] = useState(
		new QueryClient({
			defaultOptions: {
				queries: {
					cacheTime: 0,
					retry: false,
					refetchOnWindowFocus: false,
				},
			},
		}),
	);

	useEffect(() => {
		document.title = APP_NAME;
		document.documentElement.dataset.theme = REACT_APP__APP_MODE === AppMode.MAIN_VIEW ? AppTheme.V2 : AppTheme.V1;
	}, []);

	const [isInitError, setInitError] = useState(false);

	useEffect(() => {
		if (!matchPath(RoutePath.TEST, location.pathname)) {
			const start = Date.now();
			domain
				.init()
				.catch(err => {
					setInitError(true);
					console.log('Initialization error: ', JSON.stringify(err), err);
				})
				.finally(() => console.log(`Initialization took ${Date.now() - start}ms`));
		}
	}, [location.pathname]);

	useEffect(() => {
		if (!domain.accounts.hasActiveAccounts) {
			walletConnect.load();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [domain.accounts.hasActiveAccounts]);

	useEffect(() => {
		analytics.pageView(location.pathname);
	}, [location.pathname]);

	if (isInitError) {
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
				<div>Initialization error 😭</div>

				<ActionButton size={ActionButtonSize.MEDIUM} onClick={() => window.location.reload()}>
					Try again
				</ActionButton>
			</div>
		);
	}

	if (!matchPath(RoutePath.TEST, location.pathname) && !domain.initialized) {
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
			{browserStorage.isMainViewBannerHidden || REACT_APP__APP_MODE === AppMode.MAIN_VIEW || (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: '1fr auto',
						alignItems: 'center',
						justifyItems: 'center',
						gridGap: 8,
						padding: 8,
						color: '#fff',
						fontSize: 14,
						textAlign: 'center',
						background: '#000',
					}}
				>
					<div>
						Introducing Mainview – your personalized crypto news hub! Stay ahead with dynamic news feeds
						tailored to your token portfolio. Be the first – join the waitlist at{' '}
						<a href="https://mainview.io" target="_blank" rel="noreferrer">
							mainview.io
						</a>
						!
					</div>

					<ActionButton
						style={{ color: '#fff' }}
						look={ActionButtonLook.LITE}
						icon={<CrossSvg />}
						onClick={() => {
							browserStorage.isMainViewBannerHidden = true;
						}}
					/>
				</div>
			)}

			<QueryClientProvider client={queryClient}>
				<PopupManager>
					<RemoveTrailingSlash />

					<Routes>
						<Route path={RoutePath.TEST} element={<TestPage />} />
						<Route path={RoutePath.WALLETS} element={<NewWalletsPage />} />
						<Route path={RoutePath.SETTINGS} element={<SettingsPage />} />
						<Route path={RoutePath.ADMIN} element={<AdminPage />} />
						<Route path={RoutePath.ADMIN_FEED} element={<AdminFeedPage />} />

						<Route
							path={RoutePath.FEED}
							element={
								<Navigate
									replace
									to={
										REACT_APP__APP_MODE === AppMode.MAIN_VIEW
											? generatePath(RoutePath.FEED_SMART)
											: generatePath(RoutePath.FEED_ALL)
									}
								/>
							}
						/>
						<Route path={RoutePath.FEED_ALL} element={<FeedPage />} />
						<Route path={RoutePath.FEED_POST} element={<FeedPostPage />} />
						<Route path={RoutePath.FEED_CATEGORY} element={<FeedPage />} />
						<Route path={RoutePath.FEED_SOURCE} element={<FeedPage />} />
						<Route path={RoutePath.FEED_SMART} element={<FeedPage />} />
						<Route path={RoutePath.FEED_SMART_ADDRESS} element={<FeedPage />} />
						<Route path={RoutePath.FEED_VENOM_ADMIN} element={<FeedPage admin={true} />} />
						<Route path={RoutePath.FEED_VENOM} element={<FeedPage />} />

						<Route path={RoutePath.MAIL_COMPOSE} element={<ComposePage />} />
						<Route path={RoutePath.MAIL_CONTACTS} element={<ContactListPage />} />
						<Route path={RoutePath.MAIL_CONTACT_TAGS} element={<ContactTagsPage />} />
						<Route path={RoutePath.MAIL_FOLDER} element={<MailboxPage />} />
						<Route path={RoutePath.MAIL_DETAILS} element={<MailDetailsPage />} />

						<Route path={RoutePath.OTC_ASSETS} element={<OtcAssetsPage />} />
						<Route path={RoutePath.OTC_WALLETS} element={<OtcWalletsPage />} />
						<Route path={RoutePath.OTC_CHATS} element={<OtcChatsPage />} />
						<Route path={RoutePath.OTC_CHAT} element={<OtcChatPage />} />

						<Route path={RoutePath.SEND_MESSAGE_WIDGET} element={<SendMessageWidget />} />
						<Route path={RoutePath.MAILBOX_WIDGET} element={<MailboxWidget />} />

						<Route
							path={RoutePath.ANY}
							element={
								<Navigate
									replace
									to={
										REACT_APP__APP_MODE === AppMode.OTC
											? generatePath(RoutePath.OTC_ASSETS)
											: REACT_APP__APP_MODE === AppMode.MAIN_VIEW
											? generatePath(RoutePath.FEED)
											: generatePath(RoutePath.FEED_VENOM)
									}
								/>
							}
						/>
					</Routes>

					{domain.txPlateVisible && REACT_APP__APP_MODE !== AppMode.MAIN_VIEW && <TransactionPopup />}

					<StaticComponentManager />
					<ToastManager />

					{REACT_APP__APP_MODE === AppMode.MAIN_VIEW && <MainViewOnboarding />}
				</PopupManager>
			</QueryClientProvider>
		</>
	);
});

export default App;
