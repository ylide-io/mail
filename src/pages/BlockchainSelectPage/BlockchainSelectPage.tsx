import React, { useEffect, useState } from "react";
import "./BlockchainSelectPage.scss";
import auth from "../../stores/Auth";
import {
    allWalletTypes,
    WalletType,
} from "../../EverStackSDK/types/WalletType";
import ChainButton from "./components/ChainButton";
import { observer } from "mobx-react";

const BlockchainSelectPage = observer(() => {
    const [availableWallets, setAvailableWallets] = useState<WalletType[]>([]);

    useEffect(() => {
        retrieveAvailableWallets();
    }, [auth.wallet]);

    const retrieveAvailableWallets = async () => {
        const availableWallets = await auth.getAvailableWallets();
        setAvailableWallets(availableWallets);
    };

    return (
        <div className="chainSelectPageWrap">
            <div className="main">
                <div className="selectANetwork">
                    <div className="selectANetworkHeader">
                        <div className="selectANetworkDescription">
                            {" "}
                            Select network
                        </div>
                    </div>
                    <div className="selectANetworkContent">
                        {allWalletTypes.map((chain) => (
                            <ChainButton
                                key={chain}
                                available={availableWallets.includes(chain)}
                                chain={chain}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default BlockchainSelectPage;
