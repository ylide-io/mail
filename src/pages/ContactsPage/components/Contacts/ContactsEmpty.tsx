import React from 'react';
import contacts from "../../../../stores/Contacts";

const ContactsEmpty = () => {

    const createContact = () => {
        contacts.generateNewContact()
    }

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center",
            padding: "100px 20px 150px"
        }}>
            <h3>Your contacts list is empty yet.</h3>
            <div style={{marginTop: 6}}>
                <span onClick={createContact} style={{cursor: "pointer", color: "#1ab394", fontWeight: "bold"}}>Create</span>
                <span> new contact for more convenience communication.</span>
            </div>
        </div>
    );
};

export default ContactsEmpty;
