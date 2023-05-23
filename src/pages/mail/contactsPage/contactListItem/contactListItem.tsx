import { observer } from 'mobx-react';
import React, { useState } from 'react';

import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { AdaptiveAddress } from '../../../../components/adaptiveAddress/adaptiveAddress';
import { ContactAvatar } from '../../../../components/contactAvatar/contactAvatar';
import { DropDownItem, DropDownItemMode } from '../../../../components/dropDown/dropDown';
import { Recipients } from '../../../../components/recipientInput/recipientInput';
import { Select } from '../../../../components/select/select';
import { TextField } from '../../../../components/textField/textField';
import { ReactComponent as EditSvg } from '../../../../icons/ic20/edit.svg';
import { ReactComponent as MailSvg } from '../../../../icons/ic20/mail.svg';
import { ReactComponent as TickSvg } from '../../../../icons/ic20/tick.svg';
import { ReactComponent as TrashSvg } from '../../../../icons/ic20/trash.svg';
import { IContact } from '../../../../indexedDB/IndexedDB';
import contacts from '../../../../stores/Contacts';
import domain from '../../../../stores/Domain';
import { globalOutgoingMailData } from '../../../../stores/outgoingMailData';
import { RoutePath } from '../../../../stores/routePath';
import TagsStore from '../../../../stores/Tags';
import { useNav } from '../../../../utils/url';
import css from './contactListItem.module.scss';

interface ContactListItemProps {
	contact: IContact;
	isNew?: boolean;
}

export const ContactListItem = observer(({ contact, isNew }: ContactListItemProps) => {
	const navigate = useNav();

	const [isEditing, setEditing] = useState(isNew || false);
	const [name, setName] = useState(contact.name);
	const [address, setAddress] = useState(contact.address);
	const [description] = useState(contact.description);

	const [nameError, setNameError] = useState(false);
	const [addressError, setAddressError] = useState(false);

	const onNameEdit = (value: string) => {
		setName(value);
		setNameError(false);
	};

	const onAddressEdit = (value: string) => {
		setAddress(value);
		setAddressError(false);
	};

	const [selectedTagIds, setSelectedTagIds] = useState(contact.tags);

	const editClickHandler = () => {
		setEditing(true);
	};

	const saveClickHandler = () => {
		const newContact = {
			tags: selectedTagIds,
			name,
			address,
			description,
		};

		if (checkNewContactErrors(newContact)) return;

		if (isNew) {
			contacts.resetNewContact();
			contacts.createContact(newContact);
		} else {
			contacts.updateContact(newContact);
		}
		setEditing(false);
	};

	const checkNewContactErrors = (newContact: IContact) => {
		let isError = false;

		if (!domain.getBlockchainsForAddress(address).length) {
			setAddressError(true);
			isError = true;
		}

		if (!name.length) {
			setNameError(true);
			isError = true;
		}

		if (!isNew) return isError;

		const duplicateContact = contacts.contacts.find(elem => elem.address === newContact.address);

		if (duplicateContact) {
			setAddressError(true);
			isError = true;
		}

		return isError;
	};

	const deleteClickHandler = async () => {
		if (isNew) {
			contacts.resetNewContact();
		} else {
			await contacts.deleteContact(contact.address);
		}
	};

	const mailThisContact = () => {
		globalOutgoingMailData.to = new Recipients([contact.name]);
		navigate(RoutePath.MAIL_COMPOSE);
	};

	return (
		<div className={css.root}>
			{isEditing ? (
				<>
					<ContactAvatar className={css.avatar} contact={contact} />
					<div className={css.name}>
						<TextField
							isError={nameError}
							value={name}
							placeholder={'Type contact name'}
							onValueChange={onNameEdit}
						/>
					</div>
					<div className={css.address}>
						<TextField
							isError={addressError}
							placeholder={'Type contact address'}
							value={address}
							onValueChange={onAddressEdit}
						/>
					</div>
					<div className={css.folders}>
						<Select
							placeholder="Tags"
							text={
								selectedTagIds.length
									? TagsStore.getTagsFromIds(selectedTagIds)
											.map(tag => tag.name)
											.join(', ')
									: undefined
							}
						>
							{() =>
								TagsStore.tags.map(tag => {
									const isSelected = selectedTagIds.includes(tag.id);
									return (
										<DropDownItem
											mode={isSelected ? DropDownItemMode.SELECTED : undefined}
											onSelect={() => {
												setSelectedTagIds(
													isSelected
														? selectedTagIds.filter(id => id !== tag.id)
														: [...selectedTagIds, tag.id],
												);
											}}
										>
											{tag.name}
										</DropDownItem>
									);
								})
							}
						</Select>
					</div>
					<div className={css.actions}>
						<ActionButton look={ActionButtonLook.PRIMARY} onClick={saveClickHandler} icon={<TickSvg />} />
						{isNew || (
							<ActionButton
								look={ActionButtonLook.DANGEROUS}
								onClick={deleteClickHandler}
								icon={<TrashSvg />}
							/>
						)}
					</div>
				</>
			) : (
				<>
					<ContactAvatar className={css.avatar} contact={contact} />
					<div className={css.name}>{name}</div>
					<AdaptiveAddress className={css.address} address={address} />
					<div className={css.folders}>
						{TagsStore.getTagsFromIds(selectedTagIds)
							.map(tag => tag.name)
							.join(', ')}
					</div>
					<div className={css.actions}>
						<ActionButton icon={<MailSvg />} onClick={mailThisContact}>
							Compose
						</ActionButton>
						<ActionButton icon={<EditSvg />} onClick={editClickHandler}>
							Edit
						</ActionButton>
					</div>
				</>
			)}
		</div>
	);
});
