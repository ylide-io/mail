import { IObservableValue } from 'mobx';
import { observer } from 'mobx-react';
import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { QueryClient, QueryClientProvider } from 'react-query';
import { generatePath, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { FeedManagerApi } from './api/feedManagerApi';
import css from './app.module.scss';
import { ActionButton, ActionButtonLook, ActionButtonSize } from './components/ActionButton/ActionButton';
import { AuthContextProvider } from './components/authContext/authContext';
import { Faq } from './components/faq/faq';
import { MainviewLoader } from './components/mainviewLoader/mainviewLoader';
import { PopupManager } from './components/popup/popupManager/popupManager';
import { StaticComponentManager } from './components/staticComponentManager/staticComponentManager';
import { ToastManager } from './components/toast/toast';
import { APP_NAME } from './constants';
import { REACT_APP__VAPID_PUBLIC_KEY } from './env';
import { FeedPage } from './pages/feed/feedPage/feedPage';
import { FeedPostPage } from './pages/feed/feedPostPage/feedPostPage';
import { SettingsPage } from './pages/settings/settingsPage';
import { ServiceWorkerUpdateCallback } from './serviceWorkerRegistration';
import { analytics } from './stores/Analytics';
import { browserStorage } from './stores/browserStorage';
import domain from './stores/Domain';
import { DomainAccount } from './stores/models/DomainAccount';
import { RoutePath } from './stores/routePath';
import { useIsMatchesPattern, useNav } from './utils/url';
import { Web3ModalManager } from './utils/walletconnect';

export enum AppTheme {
	V1 = 'v1',
	V2 = 'v2',
}

const RemoveTrailingSlash = () => {
	const location = useLocation();
	const navigate = useNav();

	useEffect(() => {
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
		}
	});

	return <></>;
};

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

interface AppProps {
	serviceWorkerUpdateCallback: IObservableValue<ServiceWorkerUpdateCallback | undefined>;
}

export const App = observer(({ serviceWorkerUpdateCallback }: AppProps) => {
	const location = useLocation();

	const swUpdateCallback = serviceWorkerUpdateCallback.get();

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
		document.documentElement.dataset.theme = AppTheme.V2;
	}, []);

	const [initErrorId, setInitErrorId] = useState('');

	const isTestPage = useIsMatchesPattern(RoutePath.TEST);

	useEffect(() => {
		if (!isTestPage) {
			const start = Date.now();
			domain
				.init()
				.catch(err => {
					const errorId = nanoid(8);
					const msg = `Initialization error [${errorId}]: ${
						(err instanceof Error && err.stack) || JSON.stringify(err)
					}`;

					setInitErrorId(errorId);
					console.log(msg);
					throw new Error(msg);
				})
				.finally(() => console.debug(`Initialization took ${Date.now() - start}ms`));
		}
	}, [isTestPage]);

	useEffect(() => {
		analytics.pageView(location.pathname);
	}, [location.pathname]);

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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [domain.account]);

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
				<MainviewLoader />
			</div>
		);
	}

	console.log('swUpdateCallback: ', swUpdateCallback);

	return (
		<>
			<Helmet>
				<title>Mainview: Your Smart News Feed</title>
				<meta
					name="description"
					content="Master your crypto portfolio with our smart news feed. Follow tailored news based on your token holdings and DeFi positions. Stay focused on what matters most."
				/>
			</Helmet>

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

			<Web3ModalManager>
				<AuthContextProvider>
					<QueryClientProvider client={queryClient}>
						<PopupManager>
							<RemoveTrailingSlash />

							<Routes>
								<Route
									path={RoutePath.FEED}
									element={
										<Navigate
											replace
											to={
												(browserStorage.isAuthorized
													? generatePath(RoutePath.FEED_SMART)
													: generatePath(RoutePath.FEED_CATEGORY, { tag: '14' })) +
												location.search
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

								<Route path={RoutePath.SETTINGS_ADDRESS} element={<SettingsPage />} />
								<Route path={RoutePath.SETTINGS_ADDRESS_SECTION} element={<SettingsPage />} />

								<Route
									path={RoutePath.ANY}
									element={<Navigate replace to={generatePath(RoutePath.FEED) + location.search} />}
								/>
								{<Route path={RoutePath.FAQ} element={<Faq />} />}
							</Routes>

							<StaticComponentManager />
							<ToastManager />
						</PopupManager>
					</QueryClientProvider>
				</AuthContextProvider>
			</Web3ModalManager>
		</>
	);
});
