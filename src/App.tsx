import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { generatePath, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { PopupManager } from './components/popup/popupManager/popupManager';
import { StaticComponentManager } from './components/staticComponentManager/staticComponentManager';
import { YlideLoader } from './components/ylideLoader/ylideLoader';
import { AdminPage } from './pages/AdminPage';
import { ComposePage } from './pages/ComposePage/ComposePage';
import { ContactsTab } from './pages/ContactsPage/components/Contacts/ContactsTab';
import { TagsTab } from './pages/ContactsPage/components/Tags/TagsTab';
import { ContactsPage } from './pages/ContactsPage/ContactsPage';
import { FeedPage } from './pages/FeedPage/FeedPage';
import { FeedPostPage } from './pages/FeedPostPage/FeedPostPage';
import { MailboxPage } from './pages/MailboxPage/MailboxPage';
import { MailDetailsPage } from './pages/MailDetailsPage/MailDetailsPage';
import { NewWalletsPage } from './pages/NewWalletsPage';
import { OtcChatsPage } from './pages/otc/OtcChatsPage/OtcChatsPage';
import { OtcExplorerPage } from './pages/otc/OtcExplorerPage/OtcExplorerPage';
import { SettingsPage } from './pages/SettingsPage/SettingsPage';
import { TestPage } from './pages/TestPage/TestPage';
import { analytics } from './stores/Analytics';
import { browserStorage } from './stores/browserStorage';
import domain from './stores/Domain';
import { FolderId } from './stores/MailList';
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
		if (location.pathname !== '/test') {
			domain
				.init()
				.catch(err => console.log('err: ', err))
				.then(res => console.log('done'));
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

						<Route path={RoutePath.OTC_EXPLORER} element={<OtcExplorerPage />} />
						<Route path={RoutePath.OTC_CHATS} element={<OtcChatsPage />} />

						<Route
							path={RoutePath.ANY}
							element={
								<Navigate
									replace
									to={generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Inbox })}
								/>
							}
						/>
					</Routes>

					{modals.render()}
				</StaticComponentManager>
			</PopupManager>
		</QueryClientProvider>
	);
});

export default App;
