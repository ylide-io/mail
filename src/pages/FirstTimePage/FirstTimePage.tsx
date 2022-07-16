import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Logo } from "../../icons/Logo";
import { YlideButton } from "../../controls/YlideButton";
import { ArrowRight } from "../../icons/ArrowRight";
import { useNavigate } from "react-router-dom";
import domain from "../../stores/Domain";

const FirstTimePage = observer(() => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");

    let content;
    if (showPassword) {
        content = (
            <>
                <h3
                    style={{
                        fontFamily: "Lexend Exa",
                        letterSpacing: "-0.06em",
                        fontWeight: 400,
                        fontSize: 24,
                    }}
                >
                    Create password
                </h3>
                <p
                    style={{
                        fontFamily: "Lexend",
                        fontWeight: 300,
                        fontSize: 16,
                        width: 500,
                    }}
                >
                    This password will be used to encrypt and decrypt your
                    mails.
                </p>
                <br />
                <br />
                <p
                    style={{
                        fontFamily: "Lexend",
                        fontWeight: 300,
                        fontSize: 16,
                        width: 500,
                    }}
                >
                    Please save it securely, because if you lose it,
                    <br />
                    you will not be able to access your mail.
                    <br />
                    <br />
                    <b>
                        Ylide doesn't save your password anywhere,
                        <br />
                        and we won't be able to help you recover it.
                    </b>
                </p>
                <form
                    name="sign-up"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        justifyContent: "flex-start",
                    }}
                    action="/"
                    method="POST"
                    noValidate
                >
                    <input
                        style={{
                            fontFamily: "Lexend",
                            fontSize: 16,
                            borderRadius: 40,
                            height: 50,
                            border: "1px solid #000000",
                            padding: "10px 25px",
                            marginLeft: 20,
                            marginRight: 20,
                            marginTop: 20,
                        }}
                        type="password"
                        autoComplete="new-password"
                        name="password"
                        id="password"
                        placeholder="Enter Ylide password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        style={{
                            fontFamily: "Lexend",
                            fontSize: 16,
                            borderRadius: 40,
                            height: 50,
                            border: "1px solid #000000",
                            padding: "10px 25px",
                            marginLeft: 20,
                            marginRight: 20,
                            marginTop: 20,
                        }}
                        type="password"
                        autoComplete="new-password"
                        name="repeat-password"
                        id="repeat-password"
                        placeholder="Repeat your password"
                        value={passwordRepeat}
                        onChange={(e) => setPasswordRepeat(e.target.value)}
                    />

                    <YlideButton
                        type="submit"
                        onClick={(e) => {
                            e.preventDefault();
                            if (password.length < 5) {
                                alert("Minimal length is 5 symbols");
                            }
                            if (password !== passwordRepeat) {
                                alert(`Passwords don't match`);
                            }
                            domain.savedPassword = password;
                            navigate("/connect-wallets?firstTime=true");
                        }}
                        style={{
                            alignSelf: "center",
                            marginTop: 40,
                            width: 200,
                        }}
                    >
                        Continue <ArrowRight style={{ marginLeft: 6 }} />
                    </YlideButton>
                </form>
            </>
        );
    } else {
        content = (
            <>
                <div>
                    <h1 className="logo-name">
                        <Logo color="black" />
                    </h1>
                </div>
                <h3
                    style={{
                        fontFamily: "Lexend Exa",
                        letterSpacing: "-0.06em",
                        fontWeight: 400,
                        fontSize: 24,
                    }}
                >
                    Welcome to Ylide Mail
                </h3>
                <p
                    style={{
                        fontFamily: "Lexend",
                        fontWeight: 300,
                        fontSize: 16,
                    }}
                >
                    Your gate to the trustless world of communication.
                </p>
                <br />
                <br />
                <p
                    style={{
                        fontFamily: "Lexend",
                        fontWeight: 300,
                        fontSize: 16,
                    }}
                >
                    Have you ever used Ylide Mail?
                </p>
                <br />
                <br />
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 500,
                    }}
                >
                    <YlideButton
                        onClick={() => {
                            navigate("/connect-wallets");
                        }}
                        style={{ flexGrow: 1, flexBasis: 0 }}
                    >
                        I've used Ylide before
                    </YlideButton>
                    <YlideButton
                        onClick={() => {
                            setShowPassword(true);
                            // navigate("/connect-wallets");
                        }}
                        style={{ flexGrow: 1, flexBasis: 0, marginLeft: 20 }}
                    >
                        It's my first time with Ylide
                    </YlideButton>
                </div>
            </>
        );
    }

    return (
        <div
            className="middle-box text-black text-center loginscreen animated fadeInDown"
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                width: "100vw",
                paddingBottom: 100,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    justifyContent: "center",
                }}
            >
                {content}
            </div>
        </div>
    );
});

export default FirstTimePage;
