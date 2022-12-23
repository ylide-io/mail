import { observer } from 'mobx-react';
import React, { ReactNode, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header/Header';
import LinkButton from '../components/Sidebar/LinkButton';
import SidebarMenu from '../components/Sidebar/SidebarMenu';
import mailList from '../stores/MailList';
import { useWindowSize } from '../utils/useWindowSize';
import clsx from 'clsx';

interface GenericLayoutProps {
	children: ReactNode;
	mainClass?: string;
}

const GenericLayout: React.FC<GenericLayoutProps> = observer(({ children, mainClass }) => {
	const location = useLocation();
	const { windowWidth } = useWindowSize();

	const linkButtonProps = useMemo(() => {
		if (location.pathname === '/' + mailList.activeFolderId) {
			return {
				text: 'Compose Mail',
				link: '/compose',
			};
		} else if (location.pathname.startsWith('/feed/')) {
			return null;
		} else {
			return {
				text: 'Return to Mailbox',
				link: `/${mailList.activeFolderId || 'inbox'}`,
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location, mailList.activeFolderId]);

	useEffect(() => {
		setTimeout(() => {
			// @ts-ignore
			window.WonderPush = window.WonderPush || [];
			// @ts-ignore
			WonderPush.push([
				'init',
				{
					webKey: '0ae1e313db96a1e743f93f73f2130261b6efd43953263299400632d700599fa6',
				},
			]);
		}, 10000);
	}, []);

	return (
		<div className="main-layout">
			<Header />
			<div className="main-wrapper">
				<SidebarMenu />
				<div className={clsx('main-block main-content', mainClass)}>
					{windowWidth >= 920 || !linkButtonProps ? null : (
						<LinkButton text={linkButtonProps.text} link={linkButtonProps.link} />
					)}
					{children}
				</div>
			</div>
		</div>
	);
});

export default GenericLayout;
