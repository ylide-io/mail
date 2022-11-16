import React from 'react';
import contacts from '../../../../stores/Contacts';
import ContactsListItem from './ContactsListItem';
import { observer } from 'mobx-react';
import ContactsEmpty from './ContactsEmpty';

const ContactsList = observer(() => {
	const contactsList = contacts.contacts.filter(
		c => !contacts.filterByTag || c.tags.includes(contacts.filterByTag.id),
	);

	return (
		<div className="main-page">
			{!contactsList.length && !contacts.newContact ? (
				<ContactsEmpty isTagFilter={!!contacts.contacts.length} />
			) : (
				<div className="contacts-list">
					{contacts.newContact && <ContactsListItem isNew={true} contact={{ ...contacts.newContact }} />}
					{contactsList.map(contact => (
						<ContactsListItem key={contact.address} contact={{ ...contact }} />
					))}
				</div>
			)}
		</div>
	);
});

export default ContactsList;
