import React, { useEffect, useState } from "react";
import MainLayout from "../../layouts/mainLayout";
import SmallButton, {
    smallButtonColors,
} from "../../components/smallButton/smallButton";
import TabSwitcher from "./components/TabSwitcher";
import contacts from "../../stores/Contacts";
import tags from "../../stores/Tags";
import { observer } from "mobx-react";
import { Outlet, useLocation } from "react-router-dom";
import TagsFilter from "./components/TagsFilter";
import ContactsSearcher from "./components/ContactsSearcher";
import { useNav } from "../../utils/navigate";

const ContactsPage = observer(() => {
    const location = useLocation();
    const navigate = useNav();

    const addHandler = () => {
        if (location.pathname === "/contacts") {
            contacts.generateNewContact();
        } else if (location.pathname === "/contacts/folders") {
            tags.generateNewTag();
        }
    };

    return (
        <MainLayout>
            <div className="col-lg-9">
                <div className="ibox">
                    <div className="ibox-content">
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <h2>
                                {location.pathname === "/contacts"
                                    ? "Contacts"
                                    : "Folders"}
                            </h2>
                        </div>
                        <p>
                            {location.pathname === "/contacts"
                                ? "Match an address with the owner name for more convenience usage."
                                : "Create your tags for sorting messages."}
                        </p>
                        <div
                            style={
                                location.pathname === "/contacts/folders"
                                    ? { opacity: 0 }
                                    : {}
                            }
                            className="input-group"
                        >
                            <ContactsSearcher />
                        </div>
                        <div className="clients-list">
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    flexDirection: "row",
                                }}
                            >
                                <ul
                                    className="nav nav-tabs"
                                    style={{ flexGrow: 1 }}
                                >
                                    <TabSwitcher
                                        onClick={() => navigate("/contacts")}
                                        active={
                                            location.pathname === "/contacts"
                                        }
                                        text={"Contacts"}
                                        icon={"fa-user"}
                                    />
                                    <TabSwitcher
                                        onClick={() =>
                                            navigate("/contacts/folders")
                                        }
                                        active={
                                            location.pathname ===
                                            "/contacts/folders"
                                        }
                                        text={"Folders"}
                                        icon={"fa-tags"}
                                    />
                                </ul>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                    className="small text-muted"
                                >
                                    {location.pathname === "/contacts" && (
                                        <TagsFilter />
                                    )}
                                    <SmallButton
                                        color={smallButtonColors.green}
                                        onClick={addHandler}
                                        text={
                                            location.pathname === "/contacts"
                                                ? "+ Add contact"
                                                : "+ Add folder"
                                        }
                                    />
                                </div>
                            </div>
                            <div className="tab-content">
                                <Outlet />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
});

export default ContactsPage;
