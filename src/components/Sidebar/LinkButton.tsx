import React from 'react';
import {useNav} from "../../utils/navigate";

interface LinkButtonProps {
    text: string
    link: string
}

const LinkButton: React.FC<LinkButtonProps> = ({text, link}) => {
    const nav = useNav()
    return (
        <a className="btn btn-block btn-primary compose-mail" style={{color: "#FFFFFF"}} onClick={() => nav(link)}>
            {text}
        </a>
    );
};

export default LinkButton;
