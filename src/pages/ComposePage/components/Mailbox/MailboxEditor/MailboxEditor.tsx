import React, { useEffect, useMemo } from "react";
import { createReactEditorJS } from "react-editor-js";
import mailbox from "../../../../../stores/Mailbox";
import "./MailboxEditor.scss";
import { EDITOR_JS_TOOLS } from "../../../../../utils/editorJs";

const ReactEditorJS = createReactEditorJS();

const MailboxEditor = () => {
    const instanceRef = React.useRef<any>(null);

    useEffect(() => {
        return () => {
            mailbox.resetData();
        };
    }, []);

    const initialTextData = useMemo(() => {
        return mailbox.textEditorData;
    }, []);

    async function handleSave() {
        if (instanceRef?.current) {
            const savedData = await instanceRef!.current!.save();
            mailbox.saveEditorData(savedData);
        }
    }

    return (
        <div
            style={{
                padding: "25px 15px 0",
                border: "1px solid #e0e0e0",
            }}
        >
            <ReactEditorJS
                tools={EDITOR_JS_TOOLS}
                //@ts-ignore
                data={initialTextData}
                onChange={handleSave}
                instanceRef={(instance: any) =>
                    (instanceRef.current = instance)
                }
                onInitialize={(instance: any) => {
                    instanceRef.current = instance;
                }}
            />
        </div>
    );
};

export default MailboxEditor;
