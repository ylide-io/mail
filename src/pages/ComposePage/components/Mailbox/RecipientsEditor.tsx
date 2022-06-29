import React, {useEffect, useState} from 'react';
import {observer} from "mobx-react";
import contacts from "../../../../stores/Contacts";
import {IContact} from "../../../../stores/models/IContact";
import CreatableSelect from "react-select/creatable";
import auth from "../../../../stores/Auth";
import mailbox from "../../../../stores/Mailbox";
import mailer from "../../../../stores/Mailer";

interface Option {
    value: number | string,
    label: string
    __isNew__?: boolean
}

const RecipientsEditor = observer(() => {

    useEffect(() => {
        contacts.getContacts()
        getInitialValue().then(value => setValue(value))
    }, [])

    const getInitialValue = async () => {
        const value = []
        const contacts: IContact[] = []

        for (let address of mailbox.recipients) {
            const contact = await mailer.findContact(address)
            if (contact) {
                contacts.push(contact)
            } else {
                value.push({value: address, label: address})
            }
        }

        for (let contact of contacts) {
            value.push(makeOption(contact))
        }

        return value
    }

    const [value, setValue] = useState<Option[]>([])

    const makeOption = (contact: IContact) => {
        return {value: contact.id, label: contact.name}
    }

    const fromOption = (option: Option) => {
        return contacts.contacts.find(contact => contact.id === +option.value)
    }

    const options = contacts.contacts.map(tag => makeOption(tag))

    useEffect(() => {
        const recipientsAddresses: string[] = []
        value.forEach(option => {
            const isAddress = auth.wallet?.isAddressValid(option.value.toString())
            if (isAddress) {
                recipientsAddresses.push(option.value.toString())
            } else {
                const address = fromOption(option)?.address
                if (address) {
                    recipientsAddresses.push(address)
                }
            }
        })
        mailbox.setRecipients(recipientsAddresses)
    }, [value])


    const selectHandler = (options: readonly Option[]) => {
        setValue([...options])
    }

    const createOption = (label: string) => ({
        label,
        value: label.toLowerCase(),
    });

    const handleCreate = async (inputValue: string) => {
        const isValid = await auth.wallet?.isAddressValid(inputValue)

        if (isValid) {
            const newOption = createOption(inputValue)
            setValue([...value, newOption])
        }
    }

    return (
        <div className="form-group row">
            <label className="col-sm-1 col-form-label">To:</label>
            <div className="col-sm-11">
                <CreatableSelect
                    isMulti={true}
                    options={options}
                    onChange={selectHandler}
                    onCreateOption={handleCreate}
                    placeholder={"Select recipients (or type correct address)"}
                    value={value}
                />
            </div>
        </div>
    );
});

export default RecipientsEditor;
