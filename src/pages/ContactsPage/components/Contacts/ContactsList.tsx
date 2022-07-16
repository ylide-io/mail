import React from "react";
import contacts from "../../../../stores/Contacts";
import ContactsListItem from "./ContactsListItem";
import { observer } from "mobx-react";
import ContactsEmpty from "./ContactsEmpty";

const ContactsList = observer(() => {
    const contactsList = (() => {
        if (contacts.filteredContacts?.length) {
            return contacts.filteredContacts;
        } else if (contacts.filteredContacts === null) {
            return [];
        } else {
            return contacts.contacts;
        }
    })();

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
                                    key={contact.address}
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
