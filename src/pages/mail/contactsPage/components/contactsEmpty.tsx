import contacts from '../../../../stores/Contacts';

const ContactsEmpty = ({ isTagFilter }: { isTagFilter: boolean }) => {
	const createContact = () => {
		contacts.generateNewContact();
	};

	const disableFilter = () => {
		contacts.setFilterByTag(null);
	};

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				flexDirection: 'column',
				alignItems: 'center',
				padding: '100px 20px 150px',
			}}
		>
			<h3>{isTagFilter ? 'You have no contacts in the selected folder.' : 'Your contacts list is empty.'}</h3>
			<div style={{ marginTop: 6, textAlign: 'center' }}>
				<span onClick={createContact} style={{ cursor: 'pointer', color: '#1ab394', fontWeight: 'bold' }}>
					Create
				</span>
				<span> new contact.</span>
				{isTagFilter && (
					<>
						<br />
						Or{' '}
						<span
							onClick={disableFilter}
							style={{ cursor: 'pointer', color: '#1ab394', fontWeight: 'bold' }}
						>
							disable the filter
						</span>
					</>
				)}
			</div>
		</div>
	);
};

export default ContactsEmpty;
