import React, { useState } from "react";
import { observer } from "mobx-react";
import CopyTooltip from "./CopyTooltip";
import domain from "../../../stores/Domain";

const MailboxEmpty = observer(() => {
    const [copied, setCopied] = useState<"None" | "Copied" | "Hover">("None");

    const copyHandler = async (address: string) => {
        try {
            await navigator.clipboard.writeText(address);
            setCopied("Copied");
            setTimeout(() => {
                setCopied("None");
            }, 1500);
        } catch (e) {
            console.log("Error copying");
        }
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                flexDirection: "column",
                alignItems: "center",
                padding: "100px 20px 150px",
            }}
        >
            <h3>Your mailbox is empty yet.</h3>
            <div style={{ marginTop: 6 }}>
                <span>Share your addresses: </span>
                {domain.connectedKeys.map((key) => (
                    <span
                        style={{
                            position: "relative",
                            wordBreak: "break-word",
                            backgroundColor: "rgba(136,136,136,0.26)",
                            fontWeight: "bold",
                            cursor: "pointer",
                        }}
                        onMouseEnter={() => {
                            if (copied !== "Copied") {
                                setCopied("Hover");
                            }
                        }}
                        onMouseLeave={() => {
                            if (copied !== "Copied") {
                                setCopied("None");
                            }
                        }}
                        onClick={() => copyHandler(key.address)}
                    >
                        {key.address}
                        <CopyTooltip
                            status={copied !== "None" ? copied : undefined}
                        />
                    </span>
                ))}

                <span> with your friends to receive the first one!</span>
            </div>
        </div>
    );
});

export default MailboxEmpty;
