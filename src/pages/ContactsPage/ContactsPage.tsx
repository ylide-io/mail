import { PlusOutlined } from '@ant-design/icons';
import { Button, Tabs } from 'antd';
import { observer } from 'mobx-react';
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { GenericLayout } from '../../layouts/GenericLayout';
import contacts from '../../stores/Contacts';
import { RoutePath } from '../../stores/routePath';
import tags from '../../stores/Tags';
import { useNav } from '../../utils/navigate';
import { useWindowSize } from '../../utils/useWindowSize';
import ContactsSearcher from './components/ContactsSearcher';
import TagsFilter from './components/TagsFilter';

export const ContactsPage = observer(() => {
	const location = useLocation();
	const nav = useNav();
	const { windowWidth } = useWindowSize();

	const addHandler = () => {
		if (location.pathname === RoutePath.MAIL_CONTACTS) {
			contacts.generateNewContact();
		} else if (location.pathname === RoutePath.MAIL_FOLDERS) {
			tags.generateNewTag();
		}
	};

	const extraContent = (
		<>
			{location.pathname === '/mail/contacts' && <TagsFilter />}
			<Button
				onClick={addHandler}
				style={{ marginLeft: location.pathname === '/mail/contacts' ? 10 : 0 }}
				icon={<PlusOutlined />}
			>
				{location.pathname === '/mail/contacts' ? 'Add contact' : 'Add folder'}
			</Button>
		</>
	);

	return (
		<GenericLayout>
			<div className="mail-page animated fadeInRight">
				<div className="mail-top contacts-mail-top">
					<div className="mail-header">
						<h2 className="mailbox-title">
							{location.pathname === '/mail/contacts' ? 'Contacts' : 'Folders'}
						</h2>
						{location.pathname !== '/mail/folders' && (
							<div className="mail-actions">
								<div className="input-group">
									<ContactsSearcher />
								</div>
							</div>
						)}
					</div>
					{windowWidth <= 480 ? (
						<div
							style={{
								marginLeft: 10,
							}}
						>
							{extraContent}
						</div>
					) : null}
				</div>
				<div className="page-body">
					<Tabs
						activeKey={`/${location.pathname.split('/')[1]}`}
						onTabClick={key => nav(key)}
						tabBarExtraContent={windowWidth > 480 ? extraContent : null}
					>
						<Tabs.TabPane tab="Contacts" key={RoutePath.MAIL_CONTACTS} />
						<Tabs.TabPane tab="Folders" key={RoutePath.MAIL_FOLDERS} />
					</Tabs>
					<Outlet />
				</div>
			</div>
		</GenericLayout>
	);
});
