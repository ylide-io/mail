import { observer } from 'mobx-react';
import { useState } from 'react';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/actionButton/actionButton';
import { DropDownItem, DropDownItemMode } from '../../../components/dropDown/dropDown';
import { Select } from '../../../components/select/select';
import { TextField } from '../../../components/textField/textField';
import { ReactComponent as PlusSvg } from '../../../icons/ic20/plus.svg';
import { analytics } from '../../../stores/Analytics';
import contacts from '../../../stores/Contacts';
import tags from '../../../stores/Tags';
import { ContactListItem } from './contactListItem/contactListItem';
import { ContactsLayout, ContactsTab } from './contactsLayout/contactsLayout';

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

					{!!tags.tags.length && (
						<Select placeholder="Filter by tag" text={contacts.filterByTag?.name}>
							{onSelect => (
								<>
									<DropDownItem
										mode={!contacts.filterByTag ? DropDownItemMode.SELECTED : undefined}
										onSelect={() => {
											onSelect();
											contacts.setFilterByTag(null);
										}}
									>
										All tags
									</DropDownItem>

									{tags.tags.map(tag => (
										<DropDownItem
											mode={
												contacts.filterByTag?.id === tag.id
													? DropDownItemMode.SELECTED
													: undefined
											}
											onSelect={() => {
												onSelect();
												contacts.setFilterByTag(tag);
											}}
										>
											{tag.name}
										</DropDownItem>
									))}
								</>
							)}
						</Select>
					)}

					<ActionButton
						size={ActionButtonSize.MEDIUM}
						look={ActionButtonLook.PRIMARY}
						icon={<PlusSvg style={{ display: 'inline-block', verticalAlign: 'middle' }} />}
						onClick={() => {
							analytics.startCreatingContact('contacts');
							contacts.generateNewContact();
						}}
					>
						New contact
					</ActionButton>
				</>
			}
		>
			{!cleanSearchTerm && !contactsList.length && !contacts.newContact ? (
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						flexDirection: 'column',
						alignItems: 'center',
						padding: '100px 20px 150px',
					}}
				>
					<h3>No contacts</h3>
				</div>
			) : (
				<>
					{contacts.newContact && <ContactListItem isNew={true} contact={{ ...contacts.newContact }} />}
					{contactsList.map(contact => (
						<ContactListItem key={contact.address} contact={{ ...contact }} />
					))}
				</>
			)}
		</ContactsLayout>
	);
});
