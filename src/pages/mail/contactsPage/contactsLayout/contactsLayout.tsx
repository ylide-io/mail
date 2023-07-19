import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';
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

interface ContactsLayoutProps extends PropsWithChildren<{}> {
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

				<div className={css.tags}>
					<div
						className={clsx(css.tag, activeTab === ContactsTab.CONTACTS && css.tag_active)}
						onClick={() => navigate(generatePath(RoutePath.MAIL_CONTACTS))}
					>
						Contacts
					</div>

					<div
						className={clsx(css.tag, activeTab === ContactsTab.TAGS && css.tag_active)}
						onClick={() => navigate(generatePath(RoutePath.MAIL_CONTACT_TAGS))}
					>
						Tags
					</div>
				</div>

				<div>{children}</div>
			</FullPageContent>
		</GenericLayout>
	);
}
