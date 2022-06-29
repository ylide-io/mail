import React, {useEffect, useRef} from 'react';
import MailboxMail from "./MailboxMail/MailboxMail";
import mailer from "../../../stores/Mailer";
import {observer} from "mobx-react";
import MailboxEmpty from "./MailboxEmpty";


const MailsList = observer(() => {
    const interval = useRef<any>(null)

    useEffect(() => {
        mailer.retrieveFirstPage()
        startSubscribe()
        return () => {
            mailer.messages = []
            stopSubscribe()
        }
    }, [])


    useEffect(() => {
        stopSubscribe()
        if (!mailer.previousPages.length) {
            startSubscribe()
        }
    }, [mailer.previousPages.length])

    const startSubscribe = () => {
        interval.current = setInterval(() => {
            if (!mailer.previousPages.length && !mailer.loading) {
                mailer.retrieveNewMessages()
            }
        }, 5000)
    }

    const stopSubscribe = () => clearInterval(interval.current)

    return (
        <div className="mail-box">
            {mailer.messages.length ?
                <table className="table table-hover table-mail">
                    <tbody>
                    {mailer.messages.map(msg => <MailboxMail key={msg.id} message={{...msg}} />)}
                    </tbody>
                </table>
                :
                <>{!mailer.searchingText && !mailer.filteringMethod &&
                    <MailboxEmpty />
                }
                </>
            }
        </div>
    );
});

export default MailsList;
