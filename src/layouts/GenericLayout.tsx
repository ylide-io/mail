import { observer } from 'mobx-react';
import React, { ReactNode, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header/Header';
import LinkButton from '../components/Sidebar/LinkButton';
import SidebarMenu from '../components/Sidebar/SidebarMenu';
import mailList from '../stores/MailList';
import { useWindowSize } from '../utils/useWindowSize';

interface GenericLayoutProps {
	children: ReactNode;
}

const GenericLayout: React.FC<GenericLayoutProps> = observer(({ children }) => {
	const location = useLocation();
	const { windowWidth } = useWindowSize();

	const linkButtonProps = useMemo(() => {
		if (location.pathname === '/' + mailList.activeFolderId) {
			return {
				text: 'Compose Mail',
				link: '/compose',
			};
		} else {
			return {
				text: 'Return to Mailbox',
				link: `/${mailList.activeFolderId || 'inbox'}`,
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location, mailList.activeFolderId]);

	return (
		<div className="main-layout">
			<Header />
			<div className="main-wrapper">
				<SidebarMenu />
				<div className="main-block main-content">
					{windowWidth >= 920 ? null : <LinkButton text={linkButtonProps.text} link={linkButtonProps.link} />}
					{children}
				</div>
			</div>
		</div>
	);
});

export default GenericLayout;
