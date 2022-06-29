import React, { useMemo, useState } from "react";
import EthereumLogo from "../images/EthereumLogo";
import { WalletType } from "../../../EverStackSDK/types/WalletType";
import auth from "../../../stores/Auth";
import EverscaleLogo from "../images/EverscaleLogo";
import SolanaLogo from "../images/SolanaLogo";
import TronLogo from "../images/TronLogo";
import classNames from "classnames";

interface ChainButtonProps {
    chain: WalletType;
    available?: boolean;
}

const ChainButton: React.FC<ChainButtonProps> = ({ chain, available }) => {
    const { text, logo, link, walletName, isWalletAvailable } = useMemo(() => {
        switch (chain) {
            case WalletType.EverScale:
                return {
                    text: "EverScale",
                    logo: <EverscaleLogo />,
                    link: "https://l1.broxus.com/freeton/wallet",
                    walletName: "EverWallet",
                    isWalletAvailable: true,
                };
            case WalletType.Ethereum:
                return {
                    text: "Ethereum",
                    logo: <EthereumLogo />,
                    link: "https://metamask.io/",
                    walletName: "MetaMask",
                    isWalletAvailable: false,
                };
            case WalletType.Solana:
                return {
                    text: "Solana",
                    logo: <SolanaLogo />,
                    link: "https://phantom.app/",
                    walletName: "Phantom",
                    isWalletAvailable: false,
                };
            case WalletType.Tron:
                return {
                    text: "Tron",
                    logo: <TronLogo />,
                    link: "https://metamask.io/",
                    walletName: "MetaMask",
                    isWalletAvailable: false,
                };
            default:
                return {
                    text: "Error",
                    logo: <div></div>,
                };
        }
    }, [chain]);

    const clickHandler = async () => {
        if (!available) return;
        if (auth.authenticating) return;

        try {
            auth.authenticating = true;
            await auth.setWallet(chain);
            await auth.authenticate();
        } finally {
            auth.authenticating = false;
        }
    };

    return (
        <button
            onClick={clickHandler}
            disabled={!available}
            className={classNames("network", { available })}
        >
            <span style={!available ? { opacity: 0.5 } : {}}>{logo}</span>
            <div
                style={!available ? { opacity: 0.5 } : {}}
                className="networkName"
            >
                {text}
            </div>
            {!available && isWalletAvailable && (
                <span
                    style={{
                        position: "absolute",
                        fontSize: "0.8rem",
                        bottom: "-25px",
                        color: "#c0c0c0",
                    }}
                >
                    To work with {text} please install{" "}
                    <a href={link}>{walletName}</a>
                </span>
            )}
            {!isWalletAvailable ? (
                <span
                    style={{
                        position: "absolute",
                        fontSize: "0.8rem",
                        bottom: "-25px",
                        opacity: 0.4,
                    }}
                >
                    {text} is coming soon
                </span>
            ) : null}
        </button>
    );
};

export default ChainButton;
