import React from 'react';
import GenericLayout from '../../layouts/GenericLayout';
import contacts from '../../stores/Contacts';
import tags from '../../stores/Tags';
import { observer } from 'mobx-react';
import { Outlet, useLocation } from 'react-router-dom';
import ContactsSearcher from './components/ContactsSearcher';
import { useNav } from '../../utils/navigate';
import { Button, Tabs } from 'antd';
import TagsFilter from './components/TagsFilter';
import { PlusOutlined } from '@ant-design/icons';

const ContactsPage = observer(() => {
	const location = useLocation();
	const nav = useNav();

	const addHandler = () => {
		if (location.pathname === '/contacts') {
			contacts.generateNewContact();
		} else if (location.pathname === '/folders') {
			tags.generateNewTag();
		}
	};

	return (
		<GenericLayout>
			<div className="mail-page animated fadeInRight">
				<div className="mail-top contacts-mail-top">
					<div className="mail-header">
						<h2 className="mailbox-title">{location.pathname === '/contacts' ? 'Contacts' : 'Folders'}</h2>
						<div className="mail-actions">
							<div
								style={location.pathname === '/contacts/folders' ? { opacity: 0 } : {}}
								className="input-group"
							>
								<ContactsSearcher />
							</div>
						</div>
					</div>
				</div>
				<div className="page-body">
					<Tabs
						activeKey={location.pathname.split('/')[1]}
						onTabClick={key => nav(`/${key}`)}
						tabBarExtraContent={
							<>
								{location.pathname === '/contacts' && <TagsFilter />}
								<Button onClick={addHandler} style={{ marginLeft: 10 }} icon={<PlusOutlined />}>
									{location.pathname === '/contacts' ? 'Add contact' : 'Add folder'}
								</Button>
							</>
						}
					>
						<Tabs.TabPane tab="Contacts" key="contacts" />
						<Tabs.TabPane tab="Folders" key="folders" />
					</Tabs>
					<Outlet />
				</div>
			</div>
		</GenericLayout>
	);
});

export default ContactsPage;
