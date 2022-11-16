import React, { ChangeEvent, useMemo, useState } from 'react';
import { ITag } from '../../../../stores/models/ITag';
import classNames from 'classnames';
import contacts from '../../../../stores/Contacts';
import { IContact } from '../../../../stores/models/IContact';
import TagsStore from '../../../../stores/Tags';
import mailbox from '../../../../stores/Mailbox';
import { useNav } from '../../../../utils/navigate';
import domain from '../../../../stores/Domain';
import { Avatar, Button, Input, Select } from 'antd';
import { Blockie } from '../../../../controls/Blockie';
import { DeleteOutlined, EditOutlined, MailOutlined, SaveOutlined } from '@ant-design/icons';
import { AdaptiveAddress } from '../../../../controls/AdaptiveAddress';

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

	const [nameError, setNameError] = useState(false);
	const [addressError, setAddressError] = useState(false);

	const onNameEdit = (e: ChangeEvent<HTMLInputElement>) => {
		setName(e.target.value);
		setNameError(false);
	};

	const onAddressEdit = (e: ChangeEvent<HTMLInputElement>) => {
		setAddress(e.target.value);
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
		mailbox.to = [
			{
				type: 'contact',
				loading: false,
				isAchievable: null,
				input: contact.name,
				address: contact.address,
			},
		];
		navigate('/compose');
	};

	if (editing) {
		return (
			<div className="contacts-list-item">
				<div className="contact-avatar">
					{contact.img ? <img alt="Avatar" src={contact.img} /> : <Avatar />}
				</div>
				<div className="contact-name">
					<Input
						type="text"
						style={nameError ? { border: '1px solid red', width: '890%' } : { width: '90%' }}
						value={name}
						placeholder={'Type contact name'}
						onChange={onNameEdit}
					/>
				</div>
				<div className="contact-address">
					<Input
						style={addressError ? { border: '1px solid red', width: '90%' } : { width: '90%' }}
						placeholder={'Type contact address'}
						type="text"
						value={address}
						onChange={onAddressEdit}
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
					<Button type="primary" size="small" onClick={saveClickHandler} icon={<SaveOutlined />} />
					{!isNew ? (
						<Button
							type="dashed"
							size="small"
							danger
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
					<span
						key={index}
						style={{ marginLeft: '3px' }}
						className={classNames(['label', `label-${tag.color}`])}
					>
						{tag.name}
					</span>
				))}
			</div>
			<div className="contact-actions">
				<Button type="dashed" size="small" onClick={mailThisContact} icon={<MailOutlined />}>
					Compose
				</Button>
				<Button type="dashed" size="small" onClick={editClickHandler} icon={<EditOutlined />}>
					Edit
				</Button>
			</div>
		</div>
	);
};

export default ContactsListItem;
