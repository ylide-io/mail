import React, { useEffect } from 'react';
import { observer } from 'mobx-react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import domain from './stores/Domain';

import ComposePage from './pages/ComposePage/ComposePage';
import MailboxPage from './pages/MailboxPage/MailboxPage';
import MailDetail from './pages/MailDetail';
import ContactsPage from './pages/ContactsPage/ContactsPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import ContactsTab from './pages/ContactsPage/components/Contacts/ContactsTab';
import TagsTab from './pages/ContactsPage/components/Tags/TagsTab';
import FirstTimePage from './pages/FirstTimePage/FirstTimePage';
import ConnectWalletsPage from './pages/ConnectWalletsPage/ConnectWalletsPage';

import './modals/style.scss';
import { PasswordModal } from './modals/PasswordModal';
import modals from './stores/Modals';

const App = observer(() => {
	const location = useLocation();

	useEffect(() => {
		domain
			.init()
			.catch(err => console.log('err: ', err))
			.then(res => console.log('done'));
	}, []);

	useEffect(() => {
		if (modals.anyModalVisible) {
			document.body.classList.add('modal-body-catch');
		} else {
			document.body.classList.remove('modal-body-catch');
		}
	}, [modals.anyModalVisible]);

	if (!domain.initialized) {
		return <>Loading...</>;
	}

	console.log('domain.isFirstTime: ', domain.isFirstTime);
	console.log('location.pathname: ', location.pathname);

	if (domain.isFirstTime && location.pathname !== '/first-time' && location.pathname !== '/connect-wallets') {
		return <Navigate to="/first-time" state={{ from: location }} replace />;
	}

	return (
		<>
			<Routes>
				<>
					<Route path={'/first-time'} element={<FirstTimePage />} />
					<Route path={'/connect-wallets'} element={<ConnectWalletsPage />} />
					<Route path={'/compose'} element={<ComposePage />} />
					<Route path={'/mailbox'} element={<MailboxPage />} />
					<Route path={'/mailbox/:id'} element={<MailDetail />} />
					<Route path={'/contacts'} element={<ContactsPage />}>
						<Route index element={<ContactsTab />} />
						<Route path={'folders'} element={<TagsTab />} />
					</Route>
					<Route path={'/settings'} element={<SettingsPage />} />
					<Route path={'/*'} element={<Navigate replace to="/mailbox" />} />
				</>
			</Routes>
			<PasswordModal
				reason={modals.passwordModalReason}
				visible={modals.passwordModalVisible}
				onResolve={val => {
					modals.passwordModalVisible = false;
					modals.passwordModalHandler(val);
				}}
			/>
		</>
	);
});

export default App;
