import React, { useEffect, useMemo } from "react";
import contacts from "../../../../stores/Contacts";
import ContactsListItem from "./ContactsListItem";
import { observer } from "mobx-react";
import tags from "../../../../stores/Tags";
import ContactsEmpty from "./ContactsEmpty";

const ContactsList = observer(() => {
    useEffect(() => {
        tags.retrieveTags().then(() => {
            contacts.getContacts();
        });
    }, []);

    const contactsList = useMemo(() => {
        if (contacts.filteredContacts?.length) {
            return contacts.filteredContacts;
        } else if (contacts.filteredContacts === null) {
            return [];
        } else {
            return contacts.contacts;
        }
    }, [contacts.contacts, contacts.filteredContacts]);

    return (
        <>
            {!contacts.contacts.length && !contacts.newContact ? (
                <ContactsEmpty />
            ) : (
                <table className="table table-striped table-hover">
                    <tbody>
                        {contacts.newContact && (
                            <ContactsListItem
                                isNew={true}
                                contact={{ ...contacts.newContact }}
                            />
                        )}
                        {contactsList
                            .filter((elem) => {
                                if (!contacts.filterByTag) return true;

                                return elem.tags.includes(
                                    contacts.filterByTag.id
                                );
                            })
                            .map((contact) => (
                                <ContactsListItem
                                    key={contact.id}
                                    contact={{ ...contact }}
                                />
                            ))}
                    </tbody>
                </table>
            )}
        </>
    );
});

export default ContactsList;
