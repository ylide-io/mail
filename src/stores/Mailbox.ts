import { makeAutoObservable } from "mobx";

class Mailbox {
    recipients: string[] = [];
    subject: string = "";

    textEditorData: any | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    setRecipients(addresses: string[]) {
        this.recipients = addresses;
    }

    setSubject(str: string) {
        this.subject = str;
    }

    saveEditorData(data: any) {
        this.textEditorData = data;
    }

    resetData() {
        this.setRecipients([]);
        this.setSubject("");
        this.saveEditorData("");
    }
}

const mailbox = new Mailbox();

export default mailbox;
