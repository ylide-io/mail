import { DeleteOutlined, EditOutlined, MailOutlined, SaveOutlined } from '@ant-design/icons';
import { Avatar, Select } from 'antd';
import clsx from 'clsx';
import React, { useMemo, useState } from 'react';

import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { Recipients } from '../../../../components/recipientInput/recipientInput';
import { TextField } from '../../../../components/textField/textField';
import { AdaptiveAddress } from '../../../../controls/adaptiveAddress/adaptiveAddress';
import { Blockie } from '../../../../controls/Blockie';
import contacts from '../../../../stores/Contacts';
import domain from '../../../../stores/Domain';
import { IContact } from '../../../../stores/models/IContact';
import { ITag } from '../../../../stores/models/ITag';
import { globalOutgoingMailData } from '../../../../stores/outgoingMailData';
import { RoutePath } from '../../../../stores/routePath';
import TagsStore from '../../../../stores/Tags';
import { useNav } from '../../../../utils/navigate';

interface ContactsListItemProps {
	contact: IContact;
	isNew?: boolean;
}

interface Option {
	value: number;
	label: string;
}

const ContactsListItem: React.FC<ContactsListItemProps> = ({ contact, isNew }) => {
	const navigate = useNav();

	const [editing, setEditing] = useState(isNew || false);
	const [name, setName] = useState(contact.name);
	const [address, setAddress] = useState(contact.address);
	const [description, setDescription] = useState(contact.description);

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

	const [tags, setTags] = useState<ITag[]>(TagsStore.getTagsFromIds(contact.tags));

	const editClickHandler = () => {
		setEditing(true);
	};

	const saveClickHandler = () => {
		const newContact = {
			tags: tags.map(tag => tag.id),
			name,
			address,
			description,
		};

		if (checkNewContactErrors(newContact)) return;

		if (isNew) {
			contacts.resetNewContact();
			contacts.saveContact(newContact);
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

	const fromOption = (option: Option) => {
		return TagsStore.tags.find(tag => tag.id === +option);
	};

	const options = TagsStore.tags.map(tag => ({ value: tag.id, label: tag.name }));

	const defaultOptions = useMemo(() => {
		return tags.map(tag => ({ value: tag.id, label: tag.name }));
	}, [tags]);

	const selectHandler = (options: readonly Option[]) => {
		const tags: ITag[] = [];

		options.forEach(elem => {
			const tag = fromOption(elem);
			if (tag) {
				tags.push(tag);
			}
		});

		setTags(tags);
	};

	const mailThisContact = () => {
		globalOutgoingMailData.to = new Recipients([contact.name]);
		navigate(RoutePath.MAIL_COMPOSE);
	};

	if (editing) {
		return (
			<div className="contacts-list-item">
				<div className="contact-avatar">
					{contact.img ? <img alt="Avatar" src={contact.img} /> : <Avatar />}
				</div>
				<div className="contact-name">
					<TextField
						isError={nameError}
						value={name}
						placeholder={'Type contact name'}
						onValueChange={onNameEdit}
					/>
				</div>
				<div className="contact-address">
					<TextField
						isError={addressError}
						placeholder={'Type contact address'}
						value={address}
						onValueChange={onAddressEdit}
					/>
				</div>
				<div className="contact-folders">
					<Select
						style={{ width: '100%', minWidth: 200 }}
						mode="tags"
						options={options}
						defaultValue={defaultOptions}
						onChange={selectHandler}
						placeholder="Select folders"
					/>
				</div>
				<div className="contact-actions">
					<ActionButton look={ActionButtonLook.PRIMARY} onClick={saveClickHandler} icon={<SaveOutlined />} />
					{!isNew ? (
						<ActionButton
							look={ActionButtonLook.DENGEROUS}
							onClick={deleteClickHandler}
							icon={<DeleteOutlined />}
						/>
					) : null}
				</div>
			</div>
		);
	}

	return (
		<div className="contacts-list-item">
			<div className="contact-avatar">
				{contact.img ? (
					<Avatar src={contact.img} />
				) : (
					<Blockie className="contact-blockie" address={contact.address} />
				)}
			</div>
			<div className="contact-name">{name}</div>
			<div className="contact-address">
				<AdaptiveAddress address={address} />
			</div>
			<div style={{ textAlign: 'center' }} className="contact-folders">
				{tags.map((tag, index) => (
					<span key={index} style={{ marginLeft: '3px' }} className={clsx(['label', `label-${tag.color}`])}>
						{tag.name}
					</span>
				))}
			</div>
			<div className="contact-actions">
				<ActionButton onClick={mailThisContact} icon={<MailOutlined />}>
					Compose
				</ActionButton>
				<ActionButton onClick={editClickHandler} icon={<EditOutlined />}>
					Edit
				</ActionButton>
			</div>
		</div>
	);
};

export default ContactsListItem;
