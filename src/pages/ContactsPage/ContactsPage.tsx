import React, { useEffect } from 'react';
import GenericLayout from '../../layouts/GenericLayout';
import contacts from '../../stores/Contacts';
import tags from '../../stores/Tags';
import { observer } from 'mobx-react';
import { Outlet, useLocation, useSearchParams } from 'react-router-dom';
import ContactsSearcher from './components/ContactsSearcher';
import { useNav } from '../../utils/navigate';
import { Button, Tabs } from 'antd';
import TagsFilter from './components/TagsFilter';
import { PlusOutlined } from '@ant-design/icons';
import { useWindowSize } from '../../utils/useWindowSize';

const ContactsPage = observer(() => {
	const location = useLocation();
	const nav = useNav();
	const { windowWidth } = useWindowSize();

	const [searchParams] = useSearchParams();

	useEffect(() => {
		const name = searchParams.get('name');
		const address = searchParams.get('address');
		if (address) {
			contacts.generateNewContactFromParams(name || '', address);
		}
	}, []);

	const addHandler = () => {
		if (location.pathname === '/contacts') {
			contacts.generateNewContact();
		} else if (location.pathname === '/folders') {
			tags.generateNewTag();
		}
	};

	const extraContent = (
		<>
			{location.pathname === '/contacts' && <TagsFilter />}
			<Button
				onClick={addHandler}
				style={{ marginLeft: location.pathname === '/contacts' ? 10 : 0 }}
				icon={<PlusOutlined />}
			>
				{location.pathname === '/contacts' ? 'Add contact' : 'Add folder'}
			</Button>
		</>
	);

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
						activeKey={location.pathname.split('/')[1]}
						onTabClick={key => nav(`/${key}`)}
						tabBarExtraContent={windowWidth > 480 ? extraContent : null}
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
