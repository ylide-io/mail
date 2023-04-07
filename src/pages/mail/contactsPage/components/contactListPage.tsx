import { observer } from 'mobx-react';
import React, { useState } from 'react';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../components/ActionButton/ActionButton';
import { TextField } from '../../../../components/textField/textField';
import { ReactComponent as PlusSvg } from '../../../../icons/ic20/plus.svg';
import contacts from '../../../../stores/Contacts';
import tags from '../../../../stores/Tags';
import { ContactsLayout, ContactsTab } from '../contactsLayout/contactsLayout';
import ContactsEmpty from './contactsEmpty';
import { ContactsListItem } from './contactsListItem';
import { TagsFilter } from './tagsFilter';

export const ContactListPage = observer(() => {
	const [searchTerm, setSearchTerm] = useState('');
	const cleanSearchTerm = searchTerm.trim();

	const contactsList = (cleanSearchTerm ? contacts.search(searchTerm) : contacts.contacts).filter(
		c => !contacts.filterByTag || c.tags.includes(contacts.filterByTag.id),
	);

	return (
		<ContactsLayout
			activeTab={ContactsTab.CONTACTS}
			title="Contacts"
			titleRight={
				<>
					<TextField value={searchTerm} onValueChange={setSearchTerm} placeholder="Search contacts" />

					{!!tags.tags.length && <TagsFilter />}

					<ActionButton
						size={ActionButtonSize.MEDIUM}
						look={ActionButtonLook.PRIMARY}
						icon={<PlusSvg style={{ display: 'inline-block', verticalAlign: 'middle' }} />}
						onClick={() => contacts.generateNewContact()}
					>
						New contact
					</ActionButton>
				</>
			}
		>
			{!cleanSearchTerm && !contactsList.length && !contacts.newContact ? (
				<ContactsEmpty />
			) : (
				<div className="contacts-list">
					{contacts.newContact && <ContactsListItem isNew={true} contact={{ ...contacts.newContact }} />}
					{contactsList.map(contact => (
						<ContactsListItem key={contact.address} contact={{ ...contact }} />
					))}
				</div>
			)}
		</ContactsLayout>
	);
});
