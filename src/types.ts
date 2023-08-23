export type MainviewKeyPayload = {
	signature: string;
	messageTimestamp: number;
	invite: string;
	address: string;
	publicKeyHex?: string;
	signatureDataHash?: string;
	tvmType?: 'venomwallet' | 'everwallet';
};
