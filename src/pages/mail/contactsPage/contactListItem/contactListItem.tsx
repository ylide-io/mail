import { Select } from 'antd';
import { observer } from 'mobx-react';
import React, { useMemo, useState } from 'react';

import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { AdaptiveAddress } from '../../../../components/adaptiveAddress/adaptiveAddress';
import { ContactAvatar } from '../../../../components/contactAvatar/contactAvatar';
import { Recipients } from '../../../../components/recipientInput/recipientInput';
import { TextField } from '../../../../components/textField/textField';
import { ReactComponent as EditSvg } from '../../../../icons/ic20/edit.svg';
import { ReactComponent as MailSvg } from '../../../../icons/ic20/mail.svg';
import { ReactComponent as TickSvg } from '../../../../icons/ic20/tick.svg';
import { ReactComponent as TrashSvg } from '../../../../icons/ic20/trash.svg';
import { IContact, ITag } from '../../../../indexedDB/IndexedDB';
import contacts from '../../../../stores/Contacts';
import domain from '../../../../stores/Domain';
import { globalOutgoingMailData } from '../../../../stores/outgoingMailData';
import { RoutePath } from '../../../../stores/routePath';
import TagsStore from '../../../../stores/Tags';
import { useNav } from '../../../../utils/url';
import css from './contactListItem.module.scss';

interface Option {
	value: number;
	label: string;
}

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
							mode="tags"
							options={options}
							defaultValue={defaultOptions}
							onChange={selectHandler}
							placeholder="Tags"
							style={{ width: '100%' }}
						/>
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
					<div className={css.folders}>{tags.map(tag => tag.name).join(', ')}</div>
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
