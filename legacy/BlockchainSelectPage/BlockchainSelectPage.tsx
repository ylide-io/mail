import React, { useEffect, useState } from "react";
import "./BlockchainSelectPage.scss";
import auth from "../../stores/Auth";

import ChainButton from "./components/ChainButton";
import { observer } from "mobx-react";

const BlockchainSelectPage = observer(() => {
    const [availableWallets, setAvailableWallets] = useState<
        { blockchain: string; wallet: string }[]
    >([]);

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
                        {availableWallets.map(({ blockchain, wallet }) => (
                            <ChainButton
                                type={`${blockchain}:${wallet}`}
                                key={`${blockchain}:${wallet}`}
                                available={true}
                                chain={blockchain}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default BlockchainSelectPage;
