import React from 'react';
import classNames from "classnames";

interface TabSwitcherProps {
    active: boolean
    text: string
    icon: string
    onClick: () => void
}

const TabSwitcher: React.FC<TabSwitcherProps> = ({active, text, icon, onClick}) => {
    return (
        <li onClick={onClick}>
            <span style={{cursor: "pointer"}}
                  className={classNames("nav-link", {["active"]: active})}
                  data-toggle="tab">
            <i style={{paddingRight: 5}} className={classNames("fa", icon)}></i>{ }
                {text}
            </span>
        </li>
    );
};

export default TabSwitcher;
