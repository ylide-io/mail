import React, { useEffect, useRef } from "react";
import MailboxMail from "./MailboxMail/MailboxMail";
import mailer from "../../../stores/Mailer";
import { observer } from "mobx-react";
import MailboxEmpty from "./MailboxEmpty";

const MailsList = observer(() => {
    const interval = useRef<any>(null);

    useEffect(() => {
        mailer.retrieveFirstPage();
        startSubscribe();
        return () => {
            mailer.messageIds = [];
            stopSubscribe();
        };
    }, []);

    const messageIds = mailer.messageIds.slice(
        (mailer.page - 1) * mailer.messagesOnPage,
        mailer.page * mailer.messagesOnPage
    );

    const startSubscribe = () => {
        interval.current = setInterval(() => {
            if (mailer.page === 1 && !mailer.loading) {
                mailer.retrieveNewMessages();
            }
        }, 5000);
    };

    const stopSubscribe = () => clearInterval(interval.current);

    return (
        <div className="mail-box">
            {messageIds.length ? (
                <table className="table table-hover table-mail">
                    <tbody>
                        {messageIds.map((msgId) => (
                            <MailboxMail
                                key={msgId}
                                message={mailer.messagesById[msgId]}
                            />
                        ))}
                    </tbody>
                </table>
            ) : (
                <>
                    {!mailer.searchingText && !mailer.filteringMethod && (
                        <MailboxEmpty />
                    )}
                </>
            )}
        </div>
    );
});

export default MailsList;
