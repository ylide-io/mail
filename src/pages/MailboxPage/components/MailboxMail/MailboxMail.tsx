import React, {useEffect, useState} from 'react';
import classNames from "classnames";
import mailer from "../../../../stores/Mailer";
import {IStoreMessage} from "../../../../stores/models/IStoreMessage";
import contacts from "../../../../stores/Contacts";
import {IContact} from "../../../../stores/models/IContact";
import {isToday} from "../../../../utils/date";
import "./MailStyles.scss"
import {observer} from "mobx-react";
import {useNav} from "../../../../utils/navigate";

interface MailboxMailProps {
    message: IStoreMessage
}

const MailboxMail: React.FC<MailboxMailProps> = observer(({message}) => {
    const navigate = useNav()

    const messageClickHandler = async () => {
        if (message.isDecoded) {
            navigate(message.id)
        } else {
            await mailer.decodeMessage(message)
            navigate(message.id)
        }
    }

    useEffect(() => {
        findContact()
        return () => {
            mailer.checkMessage(message, false)
        }
    }, [])

    const [contact, setContact] = useState<IContact | null>(null)
    const [checked, setChecked] = useState(mailer.isMessageChecked(message.id))

    useEffect(() => {
        setChecked(mailer.isMessageChecked(message.id))
    }, [mailer.checkedMessages])

    const findContact = async () => {
        if (!message.contactId) return

        const contactsList = await contacts.getContacts()

        const contact = contactsList.find(elem => elem.id === message.contactId)

        if (contact) {
            setContact(contact)
        }
    }

    const sender = contact ? contact.name : message.decodedBody?.data.sender

    const date = (() => {
        const fullDate = new Date(message.created_at)

        if (isToday(fullDate)) {
            return fullDate.toLocaleTimeString("en-us", {hour12: false, minute: "2-digit", hour: "numeric"})
        }

        return fullDate.toLocaleString('en-us', {day: "numeric", month: 'short'}).split(" ").reverse().join(" ")
    })()

    const checkHandler = (checked: boolean) => {
        setChecked(!checked)
        mailer.checkMessage(message, !checked)
    }

    return (
        <tr style={{cursor: "pointer"}} onClick={messageClickHandler} className={
            classNames({
                ["unread"]: message.isUnread,
                ["read"]: !message.isUnread,
            })
        }>
            <td onClick={e => e.stopPropagation()} className="check-mail" style={{cursor: "pointer"}}>
                <label className="cont">
                    <input type="checkbox" onChange={() => checkHandler(checked)} checked={checked}/>
                    <span className="checkmark"></span>
                </label>
            </td>
            <td className="mail-contact" style={{paddingLeft: 20}}>
                <div>{sender.slice(0, 12)}{sender.length > 12 && "..."}</div>
            </td>
            <td className="mail-subject">
                <span
                    style={!message.isDecoded ? {filter: "blur(5px)"} : {}}>{message.isDecoded ? message.decodedSubject || "No subject" : "Message is not decoded"}</span>
                {!message.isDecoded && <span style={{marginLeft: 7}}>[Not decoded]</span>}
            </td>
            <td className="text-right mail-date">{date}</td>
        </tr>
    )
});

export default MailboxMail
