import React from 'react';
import SmallButton, {smallButtonColors, smallButtonIcons} from "../../../components/smallButton/smallButton";
import {observer} from "mobx-react";
import mailer from "../../../stores/Mailer";

const MailsListTooltips = observer(() => {

    const readHandler = () => {
        mailer.readCheckedMessage()
    }

    const deleteHandler = () => {
        mailer.deleteCheckedMessages()
    }

    const pageNextHandler = async () => {
        if(mailer.pageSwitchLoading) return
        await mailer.goNextPage()
    }

    const pagePrevHandler = async () => {
        if(mailer.pageSwitchLoading) return
        await mailer.goPrevPage()
    }

    return (
        <div className="mail-tools tooltip-demo m-t-md">
            <div className="btn-group float-right">
                <SmallButton disabled={!mailer.previousPages.length && !mailer.pageSwitchLoading} onClick={pagePrevHandler} color={smallButtonColors.white} icon={smallButtonIcons.arrowLeft} />
                <SmallButton disabled={!mailer.isNextPage && !mailer.pageSwitchLoading} onClick={pageNextHandler} color={smallButtonColors.white} icon={smallButtonIcons.forward} />
            </div>
            <div className="tooltip-buttons-space">
                <SmallButton onClick={readHandler} color={smallButtonColors.white} icon={smallButtonIcons.eye} title={"Mark as read"} />
                <SmallButton onClick={deleteHandler} color={smallButtonColors.white} icon={smallButtonIcons.trash} title={"Archive mails"} />
            </div>
        </div>
    );
});

export default MailsListTooltips;
