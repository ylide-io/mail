import React, {useEffect, useMemo, useState} from 'react';
import MainLayout from "../layouts/mainLayout";
import SmallButton, {smallButtonColors, smallButtonIcons} from "../components/smallButton/smallButton";
import {useParams} from "react-router-dom";
import mailer from "../stores/Mailer";
import {observer} from "mobx-react";
import {createReactEditorJS} from "react-editor-js";
import {toJS} from "mobx";
import {EDITOR_JS_TOOLS} from "../utils/editorJs";
import mailbox from "../stores/Mailbox";
import {IContact} from "../stores/models/IContact";
import contacts from "../stores/Contacts";
import {IStoreMessage} from "../stores/models/IStoreMessage";
import {useNav} from "../utils/navigate";

const ReactEditorJS = createReactEditorJS()

const MailDetail = observer(() => {
    const navigate = useNav()
    const {id} = useParams()

    useEffect(() => {
        if(!id) return
        (async () => {
            await mailer.getMessageById(id)
            if(!mailer.message) return

            await findContact(mailer.message)

            if(mailer.message.isDecoded) {
                mailer.readMessage(mailer.message)
            } else {
                mailer.readAndDecodeMessage(mailer.message)
            }
        })()
        return () => {
            mailer.resetCurrentMessage()
        }
    }, [])

    const encodedMessageClickHandler = () => {
        if(mailer.message) {
            mailer.decodeMessage(mailer.message)
        }
    }

    const data = useMemo(() => {
        return {blocks:toJS( mailer.message?.decodedTextData?.blocks)}
    }, [mailer.message?.decodedTextData])

    const replyClickHandler = () => {
        mailbox.recipients = [mailer.message?.decodedBody?.data?.sender || ""]
        mailbox.subject = mailer.message?.decodedSubject || ""
        navigate("/compose")
    }

    const forwardClickHandler = () => {
        mailbox.textEditorData = mailer.message?.decodedTextData || ""
        mailbox.subject = mailer.message?.decodedSubject || ""
        navigate("/compose")
    }

    const deleteHandler = () => {
        if(mailer.message) {
            mailer.deleteMessage(mailer.message)
        }
    }

    const [contact, setContact] = useState<IContact | null>(null)

    const findContact = async (message: IStoreMessage) => {
        if(!message?.contactId) return

        const contactsList = await contacts.getContacts()

        const contact = contactsList.find(elem => elem.id === message?.contactId)

        if(contact) {
            setContact(contact)
        }
    }

    return (
        <MainLayout>
            <div className="col-lg-9 animated fadeInRight">
                <div className="mail-box-header">
                    <div className="float-right tooltip-demo tooltip-buttons-space">
                        <SmallButton onClick={replyClickHandler} color={smallButtonColors.white} icon={smallButtonIcons.reply} title={"Reply"} text={"Reply"} />
                        <SmallButton onClick={deleteHandler} color={smallButtonColors.white} icon={smallButtonIcons.trash} title={"Move to trash"} />
                    </div>
                    <h2>
                        View Message
                    </h2>
                    <div className="mail-tools tooltip-demo m-t-md">
                        <h3>
                            <span className="font-normal">Subject: </span>
                            <span onClick={encodedMessageClickHandler} style={!mailer.message?.isDecoded ? {filter: "blur(5px)", cursor: "pointer"} : {}}>{mailer.message?.isDecoded ? mailer.message.decodedSubject || "No subject" : "Message is not decoded"}</span>
                        </h3>
                        <h5>
                            <span className="float-right font-normal">
                                {mailer.message && <div>
                                    <span>{new Date(mailer.message?.created_at).toLocaleTimeString("en-us", {hour12: false})}</span>
                                    <span style={{marginLeft: 6}}>{new Date(mailer.message?.created_at).toLocaleDateString("en-us", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric"
                                    }).split("/").join(".")}</span>
                                </div>
                                }
                            </span>
                            <span className="font-normal">From: </span>
                            <span>{contact ? contact.name : mailer.message?.decodedBody?.data.sender}</span>
                        </h5>
                    </div>
                </div>
                <div className="mail-box">
                    <div className="mail-body" style={{minHeight: 370}}>
                        {data.blocks ? <ReactEditorJS
                            tools={EDITOR_JS_TOOLS}
                            readOnly={true}
                            data={data}
                        /> : <div onClick={encodedMessageClickHandler} style={!mailer.message?.isDecoded ? {filter: "blur(5px)", cursor: "pointer"} : {}}>Message is not decoded yet</div>}
                    </div>
                    <div className="mail-body text-right tooltip-demo tooltip-buttons-space">
                        <SmallButton onClick={replyClickHandler} color={smallButtonColors.white} icon={smallButtonIcons.reply} title={"Reply"} text={"Reply"} />
                        <SmallButton onClick={forwardClickHandler} color={smallButtonColors.white} icon={smallButtonIcons.forward} title={"Forward"} text={"Forward"} />
                    </div>
                    <div className="clearfix"></div>
                </div>
            </div>
        </MainLayout>
    );
});

export default MailDetail;
