import React from 'react';
import MailboxEditor from "./MailboxEditor/MailboxEditor";
import SubjectEditor from "./SubjectEditor";
import RecipientsEditor from "./RecipientsEditor";


const MailboxBody = () => {
    return (
        <>
            <div className="mail-body">
                <form method="get">
                    <RecipientsEditor />
                    <SubjectEditor />
                </form>
            </div>
            <div className="mail-text h-200">
                <MailboxEditor />
                <div className="clearfix"></div>
            </div>
        </>
    );
};

export default MailboxBody;
