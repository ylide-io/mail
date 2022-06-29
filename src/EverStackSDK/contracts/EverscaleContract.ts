export const DEV_CONTRACT_ADDRESS =
    "0:4b3c6ab4348e33aebd68137a89ca6c002a776ed90cdfb3970e59ea7b3dfd7291";
export const CONTRACT_ADDRESS =
    "0:b40bf3e285b82dba93b320cc15823ef01fb200d334d09d134f2414a6c95a8ead";
export const CONTRACT_ABI = {
    "ABI version": 2,
    version: "2.2",
    header: ["time", "expire"],
    functions: [
        {
            name: "constructor",
            inputs: [],
            outputs: [],
        },
        {
            name: "sendMail",
            inputs: [
                { name: "recipient", type: "address" },
                { name: "data", type: "string" },
                { name: "nonce", type: "string" },
            ],
            outputs: [],
        },
    ],
    data: [],
    events: [
        {
            name: "MailSent",
            inputs: [
                { name: "sender", type: "address" },
                { name: "data", type: "string" },
                { name: "nonce", type: "string" },
            ],
            outputs: [],
        },
    ],
    fields: [
        { name: "_pubkey", type: "uint256" },
        { name: "_timestamp", type: "uint64" },
        { name: "_constructorFlag", type: "bool" },
    ],
};
export const DEV_CONTRACT_ABI = {
    "ABI version": 2,
    version: "2.2",
    header: ["time", "expire"],
    functions: [
        {
            name: "constructor",
            inputs: [],
            outputs: [],
        },
        {
            name: "sendMail",
            inputs: [
                { name: "recipient", type: "address" },
                { name: "data", type: "string" },
                { name: "nonce", type: "string" },
            ],
            outputs: [],
        },
    ],
    data: [],
    events: [
        {
            name: "MailSent",
            inputs: [
                { name: "sender", type: "address" },
                { name: "data", type: "string" },
                { name: "nonce", type: "string" },
            ],
            outputs: [],
        },
    ],
    fields: [
        { name: "_pubkey", type: "uint256" },
        { name: "_timestamp", type: "uint64" },
        { name: "_constructorFlag", type: "bool" },
    ],
};
