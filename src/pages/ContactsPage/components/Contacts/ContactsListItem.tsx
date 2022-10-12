import React, { ChangeEvent, useMemo, useState } from 'react';
import { ITag } from '../../../../stores/models/ITag';
import Select from 'react-select';
import classNames from 'classnames';
import contacts from '../../../../stores/Contacts';
import { IContact } from '../../../../stores/models/IContact';
import TagsStore from '../../../../stores/Tags';
import mailbox from '../../../../stores/Mailbox';
import { useNav } from '../../../../utils/navigate';
import domain from '../../../../stores/Domain';

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

	const makeOption = (tag: ITag) => {
		return { value: tag.id, label: tag.name };
	};

	const fromOption = (option: Option) => {
		return TagsStore.tags.find(tag => tag.id === +option.value);
	};

	const options = TagsStore.tags.map(tag => makeOption(tag));

	const defaultOptions = useMemo(() => {
		return tags.map(tag => makeOption(tag));
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
			<tr>
				<td className="client-avatar">
					{contact.img ? (
						<img alt="Avatar" src={contact.img} />
					) : (
						<i
							style={{
								width: '100%',
								height: '100%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
							className="fa fa-user"
						/>
					)}
				</td>
				<td>
					<input
						type="text"
						style={nameError ? { border: '1px solid red', width: '80%' } : { width: '80%' }}
						value={name}
						className="input form-control"
						placeholder={'Type contact name'}
						onChange={onNameEdit}
					/>
				</td>
				<td className="contact-type">
					<i className="fa fa-location-arrow" />
				</td>
				<td>
					<input
						style={addressError ? { border: '1px solid red', width: '100%' } : { width: '100%' }}
						className="input form-control"
						placeholder={'Type contact address'}
						type="text"
						value={address}
						onChange={onAddressEdit}
					/>
				</td>
				<td></td>
				<td style={{ textAlign: 'center' }} className="client-status">
					<Select
						isMulti={true}
						options={options}
						defaultValue={defaultOptions}
						onChange={selectHandler}
						placeholder={'Select folders'}
						styles={{
							control: style => ({
								...style,
								minHeight: 0,
								// width: 200,
							}),
							dropdownIndicator: style => ({
								...style,
								padding: '5px 8px',
							}),
						}}
					/>
				</td>
				{!isNew ? (
					<td onClick={deleteClickHandler} style={{ cursor: 'pointer', textAlign: 'center' }}>
						<i className="fa fa-trash" />
					</td>
				) : (
					<td onClick={deleteClickHandler} style={{ cursor: 'pointer', textAlign: 'center' }}>
						<i className="fa fa-times" />
					</td>
				)}
				<td onClick={saveClickHandler} style={{ cursor: 'pointer', textAlign: 'center' }}>
					<i className="fa fa-check" />
				</td>
			</tr>
		);
	}

	return (
		<tr>
			<td className="client-avatar">
				{contact.img ? (
					<img alt="Avatar" src={contact.img} />
				) : (
					<i
						style={{
							width: '100%',
							height: '100%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
						className="fa fa-user"
					/>
				)}
			</td>
			<td>
				<span className="client-link">{name}</span>
			</td>
			<td className="contact-type">
				<i className="fa fa-location-arrow" />
			</td>
			<td>
				<span>{address}</span>
			</td>
			<td style={{ textAlign: 'center' }} className="client-status">
				{tags.map((tag, index) => (
					<span
						key={index}
						style={{ marginLeft: '3px' }}
						className={classNames(['label', `label-${tag.color}`])}
					>
						{tag.name}
					</span>
				))}
			</td>
			<td onClick={mailThisContact} style={{ cursor: 'pointer', textAlign: 'center' }}>
				<i className="fa fa-envelope" />
			</td>
			<td onClick={editClickHandler} style={{ cursor: 'pointer', textAlign: 'center' }}>
				<i className="fa fa-gear" />
			</td>
		</tr>
	);
};

export default ContactsListItem;
