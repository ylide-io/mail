import { useState } from "react";
import { useEffect } from "react";
import { FC } from "react";
import { YlideButton } from "../../controls/YlideButton";

export const PasswordModal: FC<{
    visible: boolean;
    reason: string;
    onResolve: (password: string | null) => void;
}> = ({ visible, reason, onResolve }) => {
    const [value, setValue] = useState("");

    useEffect(() => {
        setValue("");
    }, [visible]);

    if (!visible) {
        return null;
    }

    return (
        <div className="modal-wrap">
            <div className="modal-backdrop" />
            <div className="modal-content">
                <div
                    className="modal-header"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: 0,
                    }}
                >
                    <h3
                        style={{
                            fontFamily: "Lexend",
                            fontSize: 24,
                            textAlign: "center",
                        }}
                    >
                        Password request
                    </h3>
                </div>
                <div
                    className="modal-subtitle"
                    style={{
                        fontFamily: "Lexend",
                        fontSize: 16,
                        textAlign: "center",
                        marginTop: 20,
                        marginBottom: 20,
                    }}
                >
                    Please, enter your Ylide password to {reason}
                </div>
                <div
                    className="modal-input"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                    }}
                >
                    <input
                        style={{
                            fontFamily: "Lexend",
                            fontSize: 16,
                            borderRadius: 40,
                            height: 36,
                            border: "1px solid #000000",
                            padding: "5px 10px",
                            marginLeft: 20,
                            marginRight: 20,
                            marginTop: 20,
                            marginBottom: 20,
                        }}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        type="password"
                        placeholder="Enter your Ylide password"
                    />
                </div>
                <div
                    className="modal-footer"
                    style={{ borderTop: "1px solid #e0e0e0", marginTop: 40 }}
                >
                    <YlideButton
                        ghost
                        onClick={() => {
                            onResolve(null);
                        }}
                    >
                        Cancel
                    </YlideButton>
                    <YlideButton
                        onClick={() => {
                            onResolve(value);
                        }}
                    >
                        Confirm
                    </YlideButton>
                </div>
            </div>
        </div>
    );
};
