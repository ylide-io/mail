export type AuthorizationPayload = {
	messageEncrypted: Uint8Array;
	publicKey: Uint8Array;
	address: string;
};
