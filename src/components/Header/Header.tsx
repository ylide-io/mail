import React from "react";
import Searcher from "../../layouts/components/searcher";
import domain from "../../stores/Domain";
import { useNav } from "../../utils/navigate";
import { Dropdown, Menu } from "antd";
import { DownOutlined, LogoutOutlined } from "@ant-design/icons";
import { observer } from "mobx-react";

const Header = observer(() => {
    const nav = useNav();

    const menu = (
        <Menu
            items={domain.connectedKeys.map((key) => ({
                key: `${key.blockchain}:${key.address}`,
                label: (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <LogoutOutlined
                            style={{ marginTop: 0, marginRight: 10 }}
                        />{" "}
                        {key.address.substr(0, 10)}... ({key.blockchain})
                    </div>
                ),
            }))}
            onClick={(info) => {
                const dk = domain.connectedKeys.find(
                    (key) => info.key === `${key.blockchain}:${key.address}`
                );
                domain.removeKey(dk!);
            }}
        />
    );

    return (
        <div className="row border-bottom">
            <nav
                className="navbar navbar-static-top white-bg mb-0"
                role="navigation"
                style={{ paddingLeft: 20, paddingRight: 20 }}
            >
                <div className="navbar-header">
                    <Searcher />
                </div>
                <ul className="nav navbar-top-links navbar-right">
                    <li>
                        <a
                            onClick={(e) => {
                                e.preventDefault();
                                nav("/contacts");
                            }}
                            style={{ cursor: "pointer" }}
                            className="m-r-sm text-muted welcome-message"
                            href="_none"
                        >
                            <i className="fa fa-users"></i>
                        </a>
                    </li>
                    <li>
                        <a
                            onClick={(e) => {
                                e.preventDefault();
                                nav("/settings");
                            }}
                            style={{ cursor: "pointer" }}
                            className="m-r-sm text-muted welcome-message"
                            href="_none"
                        >
                            <i className="fa fa-gear"></i>
                        </a>
                    </li>
                    <li>
                        <Dropdown overlay={menu}>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    color: "#707070",
                                    cursor: "pointer",
                                }}
                            >
                                {`Connected ${domain.connectedKeys.length} account`}
                                <DownOutlined
                                    size={16}
                                    style={{ marginLeft: 5 }}
                                />
                            </div>
                        </Dropdown>
                    </li>
                </ul>
            </nav>
        </div>
    );
});

export default Header;
