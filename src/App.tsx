import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { generatePath, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { PopupManager } from './components/popup/popupManager/popupManager';
import { StaticComponentManager } from './components/staticComponentManager/staticComponentManager';
import { ToastManager } from './components/toast/toast';
import { YlideLoader } from './components/ylideLoader/ylideLoader';
import { APP_NAME } from './constants';
import { REACT_APP__OTC_MODE } from './env';
import { AdminPage } from './pages/AdminPage';
import { FeedPage } from './pages/feed/feedPage/feedPage';
import { FeedPostPage } from './pages/feed/feedPostPage/feedPostPage';
import { ComposePage } from './pages/mail/composePage/composePage';
import { ContactsTab } from './pages/mail/contactsPage/components/contactsTab';
import { TagsTab } from './pages/mail/contactsPage/components/tagsTab';
import { ContactsPage } from './pages/mail/contactsPage/contactsPage';
import { MailboxPage } from './pages/mail/mailboxPage/mailboxPage';
import { MailDetailsPage } from './pages/mail/mailDetailsPage/mailDetailsPage';
import { NewWalletsPage } from './pages/NewWalletsPage';
import { OtcAssetsPage } from './pages/otc/OtcAssetsPage/OtcAssetsPage';
import { OtcChatPage } from './pages/otc/OtcChatPage/OtcChatPage';
import { OtcChatsPage } from './pages/otc/OtcChatsPage/OtcChatsPage';
import { OtcWalletsPage } from './pages/otc/OtcWalletsPage/OtcWalletsPage';
import { SettingsPage } from './pages/SettingsPage/SettingsPage';
import { TestPage } from './pages/TestPage/TestPage';
import { analytics } from './stores/Analytics';
import { browserStorage } from './stores/browserStorage';
import domain from './stores/Domain';
import { FeedCategory } from './stores/Feed';
import modals from './stores/Modals';
import { RoutePath } from './stores/routePath';
import walletConnect from './stores/WalletConnect';

const App = observer(() => {
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

	const location = useLocation();

	useEffect(() => {
		document.title = APP_NAME;
	}, []);

	useEffect(() => {
		if (location.pathname !== '/test') {
			const start = Date.now();
			domain
				.init()
				.catch(err => console.log('Initialization error: ', err))
				.then(() => console.log(`Initialized in ${Date.now() - start}ms`));
		}
	}, [location.pathname]);

	useEffect(() => {
		if (modals.anythingVisible) {
			document.body.classList.add('modal-body-catch');
		} else {
			document.body.classList.remove('modal-body-catch');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [modals.anythingVisible]);

	useEffect(() => {
		if (domain.accounts.isFirstTime) {
			walletConnect.load();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [domain.accounts.isFirstTime]);

	useEffect(() => {
		analytics.pageView(location.pathname);
	}, [location.pathname]);

	if (location.pathname !== '/test' && !domain.initialized) {
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

	if (
		domain.accounts.isFirstTime &&
		location.pathname !== '/test' &&
		location.pathname !== '/wallets' &&
		location.pathname !== '/admin' &&
		(!location.pathname.startsWith('/feed/') || !browserStorage.canSkipRegistration)
	) {
		return <Navigate to={`/wallets${location.search ? location.search : ''}`} state={{ from: location }} replace />;
	}

	return (
		<QueryClientProvider client={queryClient}>
			<PopupManager>
				<ToastManager>
					<StaticComponentManager>
						<Routes>
							<Route path={RoutePath.TEST} element={<TestPage />} />
							<Route path={RoutePath.WALLETS} element={<NewWalletsPage />} />
							<Route path={RoutePath.SETTINGS} element={<SettingsPage />} />
							<Route path={RoutePath.ADMIN} element={<AdminPage />} />

							<Route path={RoutePath.FEED} element={<FeedPage />} />
							<Route path={RoutePath.FEED_POST} element={<FeedPostPage />} />
							<Route path={RoutePath.FEED_CATEGORY} element={<FeedPage />} />

							<Route path={RoutePath.MAIL_COMPOSE} element={<ComposePage />} />
							<Route path={RoutePath.MAIL_CONTACTS} element={<ContactsPage />}>
								<Route index element={<ContactsTab />} />
							</Route>
							<Route path={RoutePath.MAIL_FOLDERS} element={<ContactsPage />}>
								<Route index element={<TagsTab />} />
							</Route>
							<Route path={RoutePath.MAIL_FOLDER} element={<MailboxPage />} />
							<Route path={RoutePath.MAIL_DETAILS} element={<MailDetailsPage />} />

							<Route path={RoutePath.OTC_ASSETS} element={<OtcAssetsPage />} />
							<Route path={RoutePath.OTC_WALLETS} element={<OtcWalletsPage />} />
							<Route path={RoutePath.OTC_CHATS} element={<OtcChatsPage />} />
							<Route path={RoutePath.OTC_CHAT} element={<OtcChatPage />} />

							<Route
								path={RoutePath.ANY}
								element={
									<Navigate
										replace
										to={
											REACT_APP__OTC_MODE
												? generatePath(RoutePath.OTC_ASSETS)
												: generatePath(RoutePath.FEED_CATEGORY, { category: FeedCategory.MAIN })
										}
									/>
								}
							/>
						</Routes>

						{modals.render()}
					</StaticComponentManager>
				</ToastManager>
			</PopupManager>
		</QueryClientProvider>
	);
});

export default App;
