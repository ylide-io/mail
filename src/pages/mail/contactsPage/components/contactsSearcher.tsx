import { Input } from 'antd';
import React, { useEffect, useState } from 'react';

import contacts from '../../../../stores/Contacts';

const ContactsSearcher = () => {
	const [contactsSearchText, setContactsSearchText] = useState('');

	useEffect(() => {
		// tags.getTags()
		contacts.filterContacts(contactsSearchText);
	}, [contactsSearchText]);

	return (
		<>
			<Input.Search
				value={contactsSearchText}
				onChange={e => setContactsSearchText(e.target.value)}
				type="text"
				placeholder="Search contact"
				enterButton="Search"
				onSearch={() => {
					//
				}}
			/>
		</>
	);
};

export default ContactsSearcher;
