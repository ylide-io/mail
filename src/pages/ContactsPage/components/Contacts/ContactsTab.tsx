import React from 'react';
import ContactsList from "./ContactsList";

const ContactsTab = () => {
    return (
        <div id="tab-1" className="tab-pane active">
            <div style={{height: "100%"}} className="full-height-scroll">
                <div style={{height: "100%"}} className="table-responsive">
                    <ContactsList />
                </div>
            </div>
        </div>
    );
}

export default ContactsTab;
