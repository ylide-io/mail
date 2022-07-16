import React, {
    ButtonHTMLAttributes,
    CSSProperties,
    FC,
    PropsWithChildren,
} from "react";
import cn from "classnames";

import "./style.scss";

export const YlideButton: FC<
    PropsWithChildren<{
        className?: string;
        onClick?: React.MouseEventHandler<HTMLButtonElement>;
        ghost?: boolean;
        style?: CSSProperties;
        type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
    }>
> = ({ children, className, onClick, ghost, style, type }) => {
    return (
        <button
            type={type}
            className={cn("ylide-button", className, { ghost })}
            style={style}
            onClick={onClick}
        >
            {children}
        </button>
    );
};
