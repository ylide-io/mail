import React, { useEffect, useState } from 'react';

import { TextField } from '../../../../components/textField/textField';
import contacts from '../../../../stores/Contacts';

const ContactsSearcher = () => {
	const [contactsSearchText, setContactsSearchText] = useState('');

	useEffect(() => {
		contacts.filterContacts(contactsSearchText);
	}, [contactsSearchText]);

	return <TextField value={contactsSearchText} onValueChange={setContactsSearchText} placeholder="Search contacts" />;
};

export default ContactsSearcher;
