import React, {useEffect} from 'react';
import MainLayout from "../../layouts/mainLayout";
import mailer from "../../stores/Mailer";
import {observer} from "mobx-react";

const SettingsPage = observer(() => {
    useEffect(() => {
        mailer.getSaveDecodedSetting()
    }, [])

    return (
        <MainLayout>
            <div className="col-lg-9">
                <div className="ibox">
                    <div className="ibox-content">
                        <div style={{display: "flex", justifyContent: "space-between"}}>
                            <h2>Settings</h2>
                        </div>

                        <div style={{marginTop: 30, display: "flex", alignItems: "center"}}>
                            <span style={{marginRight: 50}}>Save decoded mails to internal storage</span>
                            <input checked={!!mailer.saveDecodedMessages} onChange={() => mailer.setSaveDecodedSetting(!mailer.saveDecodedMessages)} type="checkbox"/>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
});

export default SettingsPage;
