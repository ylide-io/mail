import React, { useEffect } from "react";
import mailer from "../../../stores/Mailer";
import { observer } from "mobx-react";
import tags from "../../../stores/Tags";

const MailsCounter = observer(() => {
    useEffect(() => {
        tags.getTags();
    }, []);

    const calculateFolderLength = (): string => {
        const length: number = mailer.messageIds.length;
        return length + `${mailer.isNextPage ? "+" : ""}`;
    };

    const { folderName, folderLength } = (() => {
        const folderLength = calculateFolderLength();

        if (mailer.activeFolderId) {
            return {
                folderName:
                    tags.tags.find((elem) => elem.id === mailer.activeFolderId)
                        ?.name || "",
                folderLength: folderLength,
            };
        } else {
            return {
                folderName:
                    mailer.filteringMethod === "archived" ? "Archive" : "Inbox",
                folderLength: folderLength,
            };
        }
    })();

    return (
        <h2>
            {folderName} ({folderLength})
        </h2>
    );
});

export default MailsCounter;
