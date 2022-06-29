import React from 'react';
import auth from "../../stores/Auth";
import Searcher from "../../layouts/components/searcher";
import {useNav} from "../../utils/navigate";

const Header = () => {
    const nav = useNav()

    const disconnect = () => {
        auth.disconnectAccount()
    }

    return (
        <div className="row border-bottom">
            <nav
                className="navbar navbar-static-top white-bg mb-0"
                role="navigation"
                style={{paddingLeft: 20, paddingRight: 20}}
            >
                <div className="navbar-header">
                    <Searcher/>
                </div>
                <ul className="nav navbar-top-links navbar-right">
                    <li>
                        <a onClick={() => nav("/contacts")} style={{cursor: "pointer"}} className="m-r-sm text-muted welcome-message">
                            <i className="fa fa-users"></i>
                        </a>
                    </li>
                    <li>
                        <a onClick={() => nav("/settings")} style={{cursor: "pointer"}} className="m-r-sm text-muted welcome-message">
                            <i className="fa fa-gear"></i>
                        </a>
                    </li>
                    <li>
                            <span className="m-r-sm text-muted welcome-message">
                                {auth.account!.address.toString().substring(0, 20)}...
                            </span>
                    </li>
                    <li>
                        <a onClick={disconnect}>
                            <i className="fa fa-sign-out"></i> Disconnect wallet
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Header;
