import React, { useEffect, useState } from 'react';
import contacts from '../../../stores/Contacts';

const ContactsSearcher = () => {
	const [contactsSearchText, setContactsSearchText] = useState('');

	useEffect(() => {
		// tags.getTags()
		contacts.filterContacts(contactsSearchText);
	}, [contactsSearchText]);

	return (
		<>
			<input
				value={contactsSearchText}
				onChange={e => setContactsSearchText(e.target.value)}
				type="text"
				placeholder="Search contact "
				className="input form-control"
			/>
			<span className="input-group-append">
				<button type="button" className="btn btn btn-primary">
					{' '}
					<i className="fa fa-search" /> Search
				</button>
			</span>
		</>
	);
};

export default ContactsSearcher;
