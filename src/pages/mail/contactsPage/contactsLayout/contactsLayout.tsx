import { Tabs } from 'antd';
import React, { PropsWithChildren, ReactNode } from 'react';
import { generatePath } from 'react-router-dom';

import { FullPageContent } from '../../../../components/genericLayout/content/fullPageContent/fullPageContent';
import { GenericLayout } from '../../../../components/genericLayout/genericLayout';
import { RoutePath } from '../../../../stores/routePath';
import { useNav } from '../../../../utils/url';
import css from './contactsLayout.module.scss';

export enum ContactsTab {
	CONTACTS = 'CONTACTS',
	TAGS = 'TAGS',
}

interface ContactsLayoutProps extends PropsWithChildren {
	activeTab: ContactsTab;
	title: ReactNode;
	titleRight?: ReactNode;
}

export function ContactsLayout({ children, activeTab, title, titleRight }: ContactsLayoutProps) {
	const navigate = useNav();

	return (
		<GenericLayout>
			<FullPageContent className={css.root}>
				<div className={css.header}>
					<div className={css.title}>{title}</div>
					<div className={css.titleRight}>{titleRight}</div>
				</div>

				<Tabs activeKey={activeTab} onTabClick={key => navigate(generatePath(key))}>
					<Tabs.TabPane tab="Contacts" key={RoutePath.MAIL_CONTACTS} />
					<Tabs.TabPane tab="Tags" key={RoutePath.MAIL_CONTACT_TAGS} />
				</Tabs>

				<div>{children}</div>
			</FullPageContent>
		</GenericLayout>
	);
}
