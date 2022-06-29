import React from 'react';
import MainLayout from "../../layouts/mainLayout";
import SmallButton, {smallButtonColors, smallButtonIcons} from "../../components/smallButton/smallButton";
import MailboxBody from "./components/Mailbox/MailboxBody";
import Tooltip from "./components/Mailbox/tooltip";
import {useNav} from "../../utils/navigate";

const ComposePage = () => {
    const navigate = useNav()

    return (
        <MainLayout>
            <div className="col-lg-10 animated fadeInRight">
                <div className="mail-box-header">
                    <div className="float-right tooltip-demo">
                        <SmallButton onClick={() => {
                            navigate("/mailbox")
                        }} text={"Discard"} color={smallButtonColors.red} title={"Discard email"}
                                     icon={smallButtonIcons.cross}/>
                    </div>
                    <h2>Compose mail</h2>
                </div>
                <div className="mail-box">
                    <MailboxBody />
                    <Tooltip />
                    <div className="clearfix"></div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ComposePage;
