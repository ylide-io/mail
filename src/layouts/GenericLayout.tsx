import clsx from 'clsx';
import React, { ReactNode, useEffect } from 'react';

import Header from '../components/Header/Header';
import { LinkButton } from '../components/Sidebar/LinkButton';
import SidebarMenu from '../components/Sidebar/SidebarMenu';
import { TransactionPopup } from '../components/TransactionPopup/TransactionPopup';
import domain from '../stores/Domain';
import css from './GenericLayout.module.scss';

interface GenericLayoutProps {
	children: ReactNode;
	mainClass?: string;
	isCustomContent?: boolean;
	mobileTopButtonProps?: {
		text: string;
		link: string;
	};
}

export const GenericLayout = ({ children, mainClass, isCustomContent, mobileTopButtonProps }: GenericLayoutProps) => {
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
			{domain.txPlateVisible ? <TransactionPopup /> : null}
			<div className={css.main}>
				<SidebarMenu />

				<div className={clsx(css.content, isCustomContent && css.content_custom, mainClass)}>
					{!!mobileTopButtonProps && (
						<LinkButton
							className={css.linkButton}
							text={mobileTopButtonProps.text}
							link={mobileTopButtonProps.link}
						/>
					)}

					{children}
				</div>
			</div>
		</div>
	);
};
