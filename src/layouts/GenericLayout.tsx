import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { ReactNode, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import Header from '../components/Header/Header';
import { LinkButton } from '../components/Sidebar/LinkButton';
import SidebarMenu from '../components/Sidebar/SidebarMenu';
import mailList, { FolderId } from '../stores/MailList';
import css from './GenericLayout.module.scss';

interface GenericLayoutProps {
	children: ReactNode;
	mainClass?: string;
	isCustomContent?: boolean;
}

export const GenericLayout: React.FC<GenericLayoutProps> = observer(({ children, mainClass, isCustomContent }) => {
	const location = useLocation();

	const linkButtonProps = useMemo(() => {
		if (location.pathname === '/mail/' + mailList.activeFolderId) {
			return {
				text: 'Compose Mail',
				link: '/mail/compose',
			};
		} else if (location.pathname.startsWith('/feed/')) {
			return null;
		} else {
			return {
				text: '‹ Return to Mailbox',
				link: `/mail/${mailList.activeFolderId || FolderId.Inbox}`,
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
		<div className={css.root}>
			<Header />
			<div className={css.main}>
				<SidebarMenu />

				<div className={clsx(css.content, isCustomContent && css.content_custom, mainClass)}>
					{!!linkButtonProps && (
						<LinkButton
							className={css.linkButton}
							text={linkButtonProps.text}
							link={linkButtonProps.link}
						/>
					)}

					{children}
				</div>
			</div>
		</div>
	);
});
