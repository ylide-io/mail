import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import contacts from '../../../../stores/Contacts';
import { IContact } from '../../../../stores/models/IContact';
import CreatableSelect from 'react-select/creatable';
import mailbox from '../../../../stores/Mailbox';
import domain from '../../../../stores/Domain';

interface Option {
	value: number | string;
	label: string;
	__isNew__?: boolean;
}

const RecipientsEditor = observer(() => {
	const [value, setValue] = useState<Option[]>([]);

	useEffect(() => {
		const newValue = [];
		const foundContacts: IContact[] = [];

		for (const address of mailbox.recipients) {
			const contact = contacts.contactsByAddress[address];
			if (contact) {
				foundContacts.push(contact);
			} else {
				newValue.push({ value: address, label: address });
			}
		}

		for (const contact of foundContacts) {
			newValue.push(makeOption(contact));
		}

		setValue(newValue);
	}, []);

	const makeOption = (contact: IContact) => {
		return { value: contact.address, label: contact.name };
	};

	const fromOption = (option: Option) => {
		return contacts.contacts.find(contact => contact.address === option.value);
	};

	const options = contacts.contacts.map(tag => makeOption(tag));

	useEffect(() => {
		const recipientsAddresses: string[] = [];
		value.forEach(option => {
			const isAddress = domain.getBlockchainsForAddress(option.value.toString());
			if (isAddress.length) {
				recipientsAddresses.push(option.value.toString());
			} else {
				const address = fromOption(option)?.address;
				if (address) {
					recipientsAddresses.push(address);
				}
			}
		});
		mailbox.setRecipients(recipientsAddresses);
	}, [value]);

	const selectHandler = (options: readonly Option[]) => {
		setValue([...options]);
	};

	const createOption = (label: string) => ({
		label,
		value: label.toLowerCase(),
	});

	const handleCreate = async (inputValue: string) => {
		const isValid = await domain.getBlockchainsForAddress(inputValue);

		if (isValid.length) {
			const newOption = createOption(inputValue);
			setValue([...value, newOption]);
		}
	};

	return (
		<div className="form-group row">
			<label className="col-sm-1 col-form-label">To:</label>
			<div className="col-sm-11" style={{ position: 'relative', zIndex: 2 }}>
				<CreatableSelect
					isMulti={true}
					options={options}
					onChange={selectHandler}
					onCreateOption={handleCreate}
					placeholder={'Select recipients (or type correct address)'}
					value={value}
				/>
			</div>
		</div>
	);
});

export default RecipientsEditor;
