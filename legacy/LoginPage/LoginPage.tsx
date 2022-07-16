import React, { useEffect } from "react";
import { observer } from "mobx-react";
import auth from "../../stores/Auth";

const LoginPage = observer(() => {
    useEffect(() => {
        auth.setWallet("everscale:inpage-provider");
    }, []);

    const buttonText = () => {
        if (auth.loading) {
            return "Loading...";
        } else {
            const account = auth.account;
            if (account) {
                return `Continue with ${account.address
                    .toString()
                    .substring(0, 10)}...`;
            } else {
                return "Connect EverWallet";
            }
        }
    };

    return (
        <div
            className="middle-box text-white text-center loginscreen animated fadeInDown"
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                paddingBottom: 200,
            }}
        >
            <div
                onClick={() => auth.setWallet(null)}
                style={{
                    position: "absolute",
                    top: 3,
                    left: 5,
                    fontSize: "1.05rem",
                    cursor: "pointer",
                }}
            >
                ⬅ Return
            </div>
            <div>
                <div>
                    <h1 className="logo-name">ES</h1>
                </div>
                <h3>Welcome to Ylide Mail</h3>
                <p>Your gate to the trustless world of communication.</p>
                <br />
                <br />
                <button
                    type="submit"
                    className="btn btn-primary block full-width m-b"
                    onClick={() => auth.authenticate()}
                >
                    {buttonText()}
                </button>
            </div>
        </div>
    );
});

export default LoginPage;
