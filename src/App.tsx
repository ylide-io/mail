import React, {useEffect} from 'react';
import {observer} from "mobx-react";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import ComposePage from "./pages/ComposePage/ComposePage";
import auth from "./stores/Auth";
import MailboxPage from "./pages/MailboxPage/MailboxPage";
import MailDetail from "./pages/MailDetail";
import ContactsPage from "./pages/ContactsPage/ContactsPage";
import SettingsPage from "./pages/SettingsPage/SettingsPage";
import BlockchainSelectPage from "./pages/BlockchainSelectPage/BlockchainSelectPage";
import mailer from "./stores/Mailer";
import {useBeforeunload} from "react-beforeunload"
import ContactsTab from "./pages/ContactsPage/components/Contacts/ContactsTab";
import TagsTab from "./pages/ContactsPage/components/Tags/TagsTab";


const App = observer(() => {
    useEffect(() => {
        if(window.location.search === "?dev=true") {
            auth.isDev = true
        }
        checkAuth()
    }, [])

    useBeforeunload(() => {
        wipeOffDecodedMessagesFromDB()
    });

    const checkAuth = async () => {
        await auth.checkAuth()
    }

    const wipeOffDecodedMessagesFromDB = async () => {
        const saveSetting = await mailer.getSaveDecodedSetting()

        if(!saveSetting) {
            await mailer.wipeOffDecodedMessagesFromDB()
        }
    }

    if(auth.loading) {
        return <>Loading...</>
    }

    return (
        <BrowserRouter>
            <Routes>
                {auth.account ? <>
                        <Route path={"/compose"} element={<ComposePage/>}/>
                        <Route path={"/mailbox"} element={<MailboxPage/>}/>
                        <Route path={"/mailbox/:id"} element={<MailDetail/>}/>
                        <Route path={"/contacts"} element={<ContactsPage />}>
                            <Route index element={<ContactsTab />} />
                            <Route path={"folders"} element={<TagsTab />} />
                        </Route>
                        <Route path={"/settings"} element={<SettingsPage/>}/>
                        <Route path={"/*"} element={<Navigate replace to="/mailbox"/>}/>
                    </>
                    :
                    <>
                        <Route path={"/"} element={<BlockchainSelectPage/>}/>
                        <Route path={"/*"} element={<Navigate replace to="/"/>}/>
                    </>
                }
            </Routes>
        </BrowserRouter>
    );
})

export default App;
